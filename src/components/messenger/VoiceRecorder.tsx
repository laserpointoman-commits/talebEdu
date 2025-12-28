import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, X, Send, Pause, Play, Trash2 } from 'lucide-react';
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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  useEffect(() => {
    // Start recording immediately when component mounts
    startRecording();
    
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping recorder:', e);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Check for supported mime types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        }
        // Don't stop tracks here - they're managed by cleanup
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setError(t('Recording failed', 'فشل التسجيل'));
        cleanup();
      };

      mediaRecorder.start(100); // Collect data every 100ms for better quality
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError(
        err.name === 'NotAllowedError' 
          ? t('Microphone access denied', 'تم رفض الوصول للميكروفون')
          : t('Could not access microphone', 'لم نتمكن من الوصول للميكروفون')
      );
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePauseResume = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      startTimer();
    } else {
      mediaRecorderRef.current.pause();
      stopTimer();
    }
    setIsPaused(!isPaused);
  };

  const handleStop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  }, []);

  const handleSend = useCallback(() => {
    if (isRecording && mediaRecorderRef.current?.state !== 'inactive') {
      // Stop recording first
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      
      // Wait for onstop to create the blob, then send
      const checkAndSend = () => {
        setTimeout(() => {
          const currentBlob = chunksRef.current.length > 0 
            ? new Blob(chunksRef.current, { type: 'audio/webm' })
            : audioBlob;
          
          if (currentBlob && duration > 0) {
            // Stop stream tracks
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
            }
            onSend(currentBlob, duration);
          } else if (duration > 0) {
            // Retry after a short delay
            setTimeout(checkAndSend, 100);
          }
        }, 100);
      };
      checkAndSend();
    } else if (audioBlob && duration > 0) {
      // Stop stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      onSend(audioBlob, duration);
    }
  }, [isRecording, audioBlob, duration, onSend]);

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
          <div className="h-4 w-4 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        )}
        {isPaused && (
          <div className="h-4 w-4 rounded-full bg-yellow-500 flex-shrink-0" />
        )}
        
        {/* Waveform visualization */}
        <div className="flex-1 flex items-center gap-0.5 h-10 overflow-hidden">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all duration-150"
              style={{ 
                backgroundColor: colors.accent,
                height: isRecording && !isPaused 
                  ? `${20 + Math.sin((Date.now() / 100) + i) * 30 + Math.random() * 30}%`
                  : '20%',
                opacity: isRecording && !isPaused ? 1 : 0.5
              }}
            />
          ))}
        </div>

        {/* Duration */}
        <span className="text-base font-semibold min-w-[55px] text-center flex-shrink-0" style={{ color: colors.textPrimary }}>
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

      {/* Send button - Large and prominent like WhatsApp */}
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
