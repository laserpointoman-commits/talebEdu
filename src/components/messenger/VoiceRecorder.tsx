import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, X, Send, Pause, Play, Trash2 } from 'lucide-react';
import { WHATSAPP_COLORS } from './WhatsAppTheme';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  isArabic?: boolean;
}

export function VoiceRecorder({ onSend, onCancel, isArabic = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const t = (en: string, ar: string) => isArabic ? ar : en;

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      onCancel();
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
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      startTimer();
    } else {
      mediaRecorderRef.current.pause();
      stopTimer();
    }
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const handleSend = () => {
    if (isRecording) {
      handleStop();
      // Wait a bit for the blob to be created
      setTimeout(() => {
        if (audioBlob) {
          onSend(audioBlob, duration);
        }
      }, 100);
    } else if (audioBlob) {
      onSend(audioBlob, duration);
    }
  };

  const handleDelete = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopTimer();
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="flex items-center gap-3 px-3 py-2 rounded-full"
      style={{ backgroundColor: WHATSAPP_COLORS.inputBg }}
    >
      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full hover:bg-white/10"
        onClick={handleDelete}
      >
        <Trash2 className="h-5 w-5" style={{ color: WHATSAPP_COLORS.missedCall }} />
      </Button>

      {/* Recording indicator */}
      <div className="flex-1 flex items-center gap-3">
        {isRecording && (
          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
        )}
        
        {/* Waveform visualization placeholder */}
        <div className="flex-1 flex items-center gap-0.5 h-8">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all"
              style={{ 
                backgroundColor: WHATSAPP_COLORS.accent,
                height: `${Math.random() * 100}%`,
                opacity: isRecording && !isPaused ? 1 : 0.5
              }}
            />
          ))}
        </div>

        {/* Duration */}
        <span className="text-sm font-medium min-w-[40px]" style={{ color: WHATSAPP_COLORS.textPrimary }}>
          {formatDuration(duration)}
        </span>
      </div>

      {/* Pause/Resume button */}
      {isRecording && (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-white/10"
          onClick={handlePauseResume}
        >
          {isPaused ? (
            <Mic className="h-5 w-5" style={{ color: WHATSAPP_COLORS.accent }} />
          ) : (
            <Pause className="h-5 w-5" style={{ color: WHATSAPP_COLORS.textSecondary }} />
          )}
        </Button>
      )}

      {/* Send button */}
      <Button
        size="icon"
        className="h-10 w-10 rounded-full"
        style={{ backgroundColor: WHATSAPP_COLORS.accent }}
        onClick={handleSend}
      >
        <Send className="h-5 w-5 text-white" />
      </Button>
    </div>
  );
}
