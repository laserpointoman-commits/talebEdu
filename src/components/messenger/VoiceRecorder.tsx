import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, Pause, Play, Trash2 } from 'lucide-react';
import { getMessengerColors } from './MessengerThemeColors';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  isArabic?: boolean;
  isDark?: boolean;
}

export function VoiceRecorder({ onSend, onCancel, isArabic = false, isDark = false }: VoiceRecorderProps) {
  const colors = getMessengerColors(isDark);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(30).fill(20));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  useEffect(() => {
    startRecording();
    
    return () => {
      cleanup();
    };
  }, []);

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
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping recorder:', e);
      }
    }
    
    // Stop audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const updateTimer = useCallback(() => {
    if (isPaused) return;
    
    const now = performance.now();
    const elapsed = Math.floor((now - startTimeRef.current + pausedDurationRef.current) / 1000);
    setDuration(elapsed);
    
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [isPaused]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || isPaused) {
      animationRef.current = requestAnimationFrame(updateWaveform);
      return;
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Sample 30 bars from the frequency data
    const bars: number[] = [];
    const step = Math.floor(dataArray.length / 30);
    for (let i = 0; i < 30; i++) {
      const value = dataArray[i * step];
      // Normalize to 20-100 range for visual appeal
      bars.push(20 + (value / 255) * 80);
    }
    
    setWaveformBars(bars);
    animationRef.current = requestAnimationFrame(updateWaveform);
  }, [isPaused]);

  const startRecording = async () => {
    try {
      setError(null);
      chunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio analysis for waveform
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Prefer MP4 for iOS/Safari compatibility, fallback to WebM/Opus
      const preferredTypes = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      
      // Use lower bitrate for smaller file sizes (32kbps for voice is sufficient)
      const options: MediaRecorderOptions = {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000
      };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setError(t('Recording failed', 'فشل التسجيل'));
        cleanup();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      
      // Start timer using requestAnimationFrame for accurate timing
      startTimeRef.current = performance.now();
      pausedDurationRef.current = 0;
      timerRef.current = requestAnimationFrame(updateTimer);
      
      // Start waveform animation
      animationRef.current = requestAnimationFrame(updateWaveform);
      
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError(
        err.name === 'NotAllowedError' 
          ? t('Microphone access denied', 'تم رفض الوصول للميكروفون')
          : t('Could not access microphone', 'لم نتمكن من الوصول للميكروفون')
      );
    }
  };

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    if (isPaused) {
      // Resume
      mediaRecorderRef.current.resume();
      startTimeRef.current = performance.now();
      timerRef.current = requestAnimationFrame(updateTimer);
      setIsPaused(false);
    } else {
      // Pause
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      // Store accumulated duration
      pausedDurationRef.current += performance.now() - startTimeRef.current;
      setIsPaused(true);
    }
  };

  const handleSend = useCallback(() => {
    const finalDuration = duration;
    
    if (finalDuration === 0) {
      onCancel();
      return;
    }
    
    // Stop recording first if still active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      
      // Wait for final data and send
      mediaRecorderRef.current.onstop = () => {
        if (chunksRef.current.length > 0) {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          
          // Stop stream tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          
          // Stop audio context
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
          
          onSend(blob, finalDuration);
        }
      };
    }
  }, [duration, onSend, onCancel]);

  const handleDelete = () => {
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
      <div 
        className="flex items-center gap-3 px-3 py-2 rounded-full"
        style={{ backgroundColor: colors.inputBg }}
      >
        <span className="flex-1 text-sm" style={{ color: colors.missedCall }}>{error}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          style={{ color: colors.textPrimary }}
        >
          {t('Close', 'إغلاق')}
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-2 px-3 py-3 rounded-2xl"
      style={{ backgroundColor: colors.inputBg }}
    >
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
        {isRecording && !isPaused && (
          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        )}
        {isPaused && (
          <div className="h-3 w-3 rounded-full bg-yellow-500 flex-shrink-0" />
        )}
        
        {/* Waveform visualization */}
        <div className="flex-1 flex items-center justify-center gap-[2px] h-10 overflow-hidden">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-75"
              style={{ 
                backgroundColor: colors.accent,
                height: `${isPaused ? 20 : height}%`,
                opacity: isPaused ? 0.5 : 1
              }}
            />
          ))}
        </div>

        {/* Duration */}
        <span className="text-base font-mono font-semibold min-w-[50px] text-right flex-shrink-0" style={{ color: colors.textPrimary }}>
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
