import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, Pause, Trash2 } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { getMessengerColors } from './MessengerThemeColors';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  isArabic?: boolean;
  isDark?: boolean;
}

type RecorderMode = 'media' | 'wav';

function isAppleMobileWeb() {
  const ua = navigator.userAgent || '';
  const platform = (navigator as any).platform || '';
  const maxTouchPoints = (navigator as any).maxTouchPoints || 0;
  return /iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

function writeWavHeader(view: DataView, sampleRate: number, dataLength: number) {
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  // RIFF
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');

  // fmt
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (mono * 16bit)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
}

function encodeWavFromFloat32(chunks: Float32Array[], sampleRate: number): Blob {
  const totalSamples = chunks.reduce((acc, c) => acc + c.length, 0);
  const dataLength = totalSamples * 2; // 16-bit
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeWavHeader(view, sampleRate, dataLength);

  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      const s = Math.max(-1, Math.min(1, chunk[i]));
      view.setInt16(offset, s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff), true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function VoiceRecorder({ onSend, onCancel, isArabic = false, isDark = false }: VoiceRecorderProps) {
  const colors = getMessengerColors(isDark);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(30).fill(20));

  const modeRef = useRef<RecorderMode>('media');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // WAV fallback (reliable on iOS/PWA)
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  const isPausedRef = useRef(false);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const t = (en: string, ar: string) => (isArabic ? ar : en);

  const haptic = async (style: ImpactStyle) => {
    try {
      await Haptics.impact({ style });
    } catch {
      // Haptics not available on web
    }
  };

  const cleanup = useCallback(() => {
    // Stop timer
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    // Disconnect WAV nodes
    try {
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
        processorRef.current = null;
      }
      if (silentGainRef.current) {
        silentGainRef.current.disconnect();
        silentGainRef.current = null;
      }
    } catch {
      // ignore
    }

    // Stop audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Reset buffers
    chunksRef.current = [];
    pcmChunksRef.current = [];
  }, []);

  useEffect(() => {
    startRecording();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateTimer = useCallback(() => {
    if (isPausedRef.current) return;
    const now = performance.now();
    const elapsed = Math.floor((now - startTimeRef.current + pausedDurationRef.current) / 1000);
    setDuration(elapsed);
    timerRef.current = requestAnimationFrame(updateTimer);
  }, []);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || isPausedRef.current) {
      animationRef.current = requestAnimationFrame(updateWaveform);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bars: number[] = [];
    const step = Math.max(1, Math.floor(dataArray.length / 30));
    for (let i = 0; i < 30; i++) {
      const value = dataArray[i * step] ?? 0;
      bars.push(20 + (value / 255) * 80);
    }

    setWaveformBars(bars);
    animationRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      chunksRef.current = [];
      pcmChunksRef.current = [];
      void haptic(ImpactStyle.Medium);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      try {
        await audioContextRef.current.resume();
      } catch {
        // ignore
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // On iPhone/iPad (including installed web app), MediaRecorder is often unreliable.
      // Use WAV capture via WebAudio for 100% reliable voice notes.
      const apple = isAppleMobileWeb();
      modeRef.current = apple ? 'wav' : 'media';

      if (modeRef.current === 'wav') {
        const ctx = audioContextRef.current;
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        const silent = ctx.createGain();
        silent.gain.value = 0;
        silentGainRef.current = silent;

        processor.onaudioprocess = (e) => {
          if (isPausedRef.current) return;
          const input = e.inputBuffer.getChannelData(0);
          // Copy buffer (do NOT keep a reference to underlying memory)
          pcmChunksRef.current.push(new Float32Array(input));
        };

        source.connect(processor);
        processor.connect(silent);
        silent.connect(ctx.destination);

        setIsRecording(true);
        setIsPaused(false);

        startTimeRef.current = performance.now();
        pausedDurationRef.current = 0;
        timerRef.current = requestAnimationFrame(updateTimer);
        animationRef.current = requestAnimationFrame(updateWaveform);
        return;
      }

      // ===== Non-iOS: MediaRecorder =====
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const mimeType = preferredTypes.find((tt) => MediaRecorder.isTypeSupported(tt)) || '';

      const options: MediaRecorderOptions = {
        ...(mimeType ? { mimeType } : {}),
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setError(t('Recording failed', 'فشل التسجيل'));
        cleanup();
      };

      // WebM can be chunked; MP4 can be flaky with timeslice.
      if ((mediaRecorder.mimeType || '').includes('mp4')) {
        mediaRecorder.start();
      } else {
        mediaRecorder.start(250);
      }

      setIsRecording(true);
      setIsPaused(false);

      startTimeRef.current = performance.now();
      pausedDurationRef.current = 0;
      timerRef.current = requestAnimationFrame(updateTimer);
      animationRef.current = requestAnimationFrame(updateWaveform);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError(
        err?.name === 'NotAllowedError'
          ? t('Microphone access denied', 'تم رفض الوصول للميكروفون')
          : t('Could not access microphone', 'لم نتمكن من الوصول للميكروفون')
      );
    }
  };

  const handlePauseResume = () => {
    void haptic(ImpactStyle.Light);

    if (modeRef.current === 'wav') {
      if (isPaused) {
        startTimeRef.current = performance.now();
        timerRef.current = requestAnimationFrame(updateTimer);
        setIsPaused(false);
      } else {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        pausedDurationRef.current += performance.now() - startTimeRef.current;
        setIsPaused(true);
      }
      return;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    if (isPaused) {
      recorder.resume();
      startTimeRef.current = performance.now();
      timerRef.current = requestAnimationFrame(updateTimer);
      setIsPaused(false);
    } else {
      recorder.pause();
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      pausedDurationRef.current += performance.now() - startTimeRef.current;
      setIsPaused(true);
    }
  };

  const handleSend = useCallback(async () => {
    const finalDuration = duration;

    if (finalDuration === 0) {
      onCancel();
      return;
    }

    setIsRecording(false);

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }

    if (modeRef.current === 'wav') {
      // Stop stream tracks first so we stop capturing
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const blob = encodeWavFromFloat32(pcmChunksRef.current, sampleRate);

      // Close audio context / nodes
      cleanup();

      onSend(blob, finalDuration);
      return;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      setError(t('Recording failed', 'فشل التسجيل'));
      cleanup();
      return;
    }

    const hadChunksAlready = chunksRef.current.length > 0;
    const waitForChunk = hadChunksAlready
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          const onData = (e: BlobEvent) => {
            if (e.data && e.data.size > 0) {
              window.clearTimeout(timeout);
              recorder.removeEventListener('dataavailable', onData);
              resolve();
            }
          };

          const timeout = window.setTimeout(() => {
            recorder.removeEventListener('dataavailable', onData);
            reject(new Error('no_dataavailable'));
          }, 6500);

          recorder.addEventListener('dataavailable', onData);
        });

    try {
      if (recorder.state === 'paused') {
        try {
          recorder.resume();
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 120));
      }

      // requestData() is useful for chunked WebM; skip for MP4.
      if (!(recorder.mimeType || '').includes('mp4')) {
        try {
          recorder.requestData();
        } catch {
          // ignore
        }
      }

      recorder.stop();
      await waitForChunk;
      await new Promise((r) => setTimeout(r, 80));

      if (chunksRef.current.length === 0) {
        throw new Error('no_chunks');
      }

      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });

      cleanup();
      onSend(blob, finalDuration);
    } catch (e) {
      console.error('Recording finalize failed:', e);
      setError(t('Recording failed', 'فشل التسجيل'));
      cleanup();
    }
  }, [duration, onCancel, onSend, cleanup, t, updateTimer]);

  const handleDelete = () => {
    void haptic(ImpactStyle.Light);
    cleanup();
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-full" style={{ backgroundColor: colors.inputBg }}>
        <span className="flex-1 text-sm" style={{ color: colors.missedCall }}>
          {error}
        </span>
        <Button variant="ghost" size="sm" onClick={onCancel} style={{ color: colors.textPrimary }}>
          {t('Close', 'إغلاق')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-3 rounded-2xl" style={{ backgroundColor: colors.inputBg }}>
      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-full hover:bg-white/10 flex-shrink-0"
        onClick={handleDelete}
      >
        <Trash2 className="h-6 w-6" style={{ color: colors.missedCall }} />
      </Button>

      {/* Recording indicator and waveform */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        {/* Recording indicator */}
        {isRecording && !isPaused && <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
        {isPaused && <div className="h-3 w-3 rounded-full bg-yellow-500 flex-shrink-0" />}

        {/* Waveform visualization */}
        <div className="flex-1 flex items-center justify-center gap-[2px] h-10 overflow-hidden">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-75"
              style={{
                backgroundColor: colors.accent,
                height: `${isPaused ? 20 : height}%`,
                opacity: isPaused ? 0.5 : 1,
              }}
            />
          ))}
        </div>

        {/* Duration */}
        <span
          className="text-base font-mono font-semibold min-w-[50px] text-right flex-shrink-0"
          style={{ color: colors.textPrimary }}
        >
          {formatDuration(duration)}
        </span>
      </div>

      {/* Pause/Resume button */}
      {isRecording && (
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full hover:bg-white/10 flex-shrink-0"
          onClick={handlePauseResume}
        >
          {isPaused ? (
            <Mic className="h-6 w-6" style={{ color: colors.accent }} />
          ) : (
            <Pause className="h-6 w-6" style={{ color: colors.textSecondary }} />
          )}
        </Button>
      )}

      {/* Send button */}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full flex-shrink-0 shadow-lg transition-transform active:scale-95"
        style={{ backgroundColor: colors.accent }}
        onClick={handleSend}
        disabled={duration === 0}
      >
        <Send className="h-7 w-7 text-white" />
      </Button>
    </div>
  );
}
