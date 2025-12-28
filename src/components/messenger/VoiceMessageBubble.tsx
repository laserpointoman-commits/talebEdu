import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Mic } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface VoiceMessageBubbleProps {
  audioUrl: string;
  duration: number;
  isOwnMessage: boolean;
  colors: {
    accent: string;
    textMuted: string;
    textSecondary: string;
    bgTertiary: string;
  };
}

export function VoiceMessageBubble({ 
  audioUrl, 
  duration, 
  isOwnMessage,
  colors 
}: VoiceMessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<number | null>(null);
  const recoveredObjectUrlRef = useRef<string | null>(null);
  const recoveryAttemptedRef = useRef(false);

  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    // Helps with certain cross-origin media behaviors (range requests, etc.)
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (progressInterval.current) {
        cancelAnimationFrame(progressInterval.current);
      }
    };

    const attemptRecovery = async () => {
      if (recoveryAttemptedRef.current) {
        setError(true);
        return;
      }
      recoveryAttemptedRef.current = true;

      try {
        const res = await fetch(audioUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();

        const inferredType =
          audioUrl.includes('.mp4') || audioUrl.includes('.m4a')
            ? 'audio/mp4'
            : 'audio/webm';

        const blob = new Blob([buffer], { type: inferredType });
        const objUrl = URL.createObjectURL(blob);
        recoveredObjectUrlRef.current = objUrl;

        audio.src = objUrl;
        audio.load();
      } catch (err) {
        console.error('Audio recovery failed:', err);
        setError(true);
      }
    };

    const handleError = (e: any) => {
      console.error('Audio load error:', e);
      void attemptRecovery();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Set source
    setError(false);
    setIsLoaded(false);
    recoveryAttemptedRef.current = false;
    audio.src = audioUrl;
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);

      if (progressInterval.current) {
        cancelAnimationFrame(progressInterval.current);
      }
      audio.pause();
      audio.src = '';

      if (recoveredObjectUrlRef.current) {
        URL.revokeObjectURL(recoveredObjectUrlRef.current);
        recoveredObjectUrlRef.current = null;
      }
    };
  }, [audioUrl]);

  // Update progress during playback
  const updateProgress = useCallback(() => {
    if (audioRef.current && isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
      progressInterval.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = requestAnimationFrame(updateProgress);
    } else if (progressInterval.current) {
      cancelAnimationFrame(progressInterval.current);
    }
    
    return () => {
      if (progressInterval.current) {
        cancelAnimationFrame(progressInterval.current);
      }
    };
  }, [isPlaying, updateProgress]);

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError(true);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2, 0.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate actual duration from audio or use provided
  const actualDuration = audioRef.current?.duration || duration;
  const progress = actualDuration > 0 ? (currentTime / actualDuration) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center gap-3 min-w-[200px] opacity-50">
        <div 
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.bgTertiary }}
        >
          <Mic className="h-5 w-5" style={{ color: colors.textMuted }} />
        </div>
        <span className="text-sm" style={{ color: colors.textMuted }}>
          Unable to play
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-[220px] max-w-[280px]">
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 rounded-full flex-shrink-0 transition-transform active:scale-95"
        style={{ backgroundColor: colors.accent }}
        onClick={togglePlayback}
        disabled={!isLoaded && !error}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 text-white" fill="white" />
        ) : (
          <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
        )}
      </Button>

      {/* Waveform/Progress */}
      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform bars (static visual) with progress overlay */}
        <div className="relative h-8 flex items-center">
          <div className="absolute inset-0 flex items-center gap-[2px]">
            {Array.from({ length: 28 }).map((_, i) => {
              // Generate consistent "random" heights based on index
              const seed = (i * 7 + 13) % 17;
              const height = 25 + (seed / 17) * 75;
              const isPlayed = (i / 28) * 100 <= progress;
              
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-colors duration-150"
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: isPlayed ? colors.accent : colors.textMuted,
                    opacity: isPlayed ? 1 : 0.4
                  }}
                />
              );
            })}
          </div>
          
          {/* Invisible slider for seeking */}
          <Slider
            value={[currentTime]}
            max={actualDuration || duration}
            step={0.1}
            onValueChange={handleSeek}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {/* Time and speed controls */}
        <div className="flex items-center justify-between">
          <span 
            className="text-xs font-mono" 
            style={{ color: colors.textMuted }}
          >
            {isPlaying ? formatTime(currentTime) : formatTime(actualDuration || duration)}
          </span>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={cyclePlaybackRate}
              className="text-xs px-1.5 py-0.5 rounded font-medium transition-colors"
              style={{ 
                backgroundColor: colors.bgTertiary,
                color: colors.textSecondary 
              }}
            >
              {playbackRate}×
            </button>
            <Mic className="h-4 w-4" style={{ color: colors.accent }} />
          </div>
        </div>
      </div>
    </div>
  );
}
