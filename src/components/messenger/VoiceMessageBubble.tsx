import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Mic } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';

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
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<number | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Extract file path from URL for refreshing signed URLs
  const extractFilePath = (url: string): string | null => {
    try {
      // Match patterns like /message-attachments/user-id/filename.mp4
      const match = url.match(/message-attachments\/([^?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Fetch audio as blob for reliable iOS playback
  const loadAudioBlob = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    
    try {
      let urlToFetch = audioUrl;
      
      // If URL looks expired or is a storage URL, try to get fresh signed URL
      const filePath = extractFilePath(audioUrl);
      if (filePath) {
        const { data: signedData } = await supabase.storage
          .from('message-attachments')
          .createSignedUrl(filePath, 3600);
        
        if (signedData?.signedUrl) {
          urlToFetch = signedData.signedUrl;
        }
      }

      // Fetch audio as blob for iOS compatibility
      const response = await fetch(urlToFetch, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = await response.arrayBuffer();
      const inferredType = (() => {
        const hint = (filePath || urlToFetch).toLowerCase();
        if (hint.includes('.wav')) return 'audio/wav';
        if (hint.includes('.m4a') || hint.includes('.mp4')) return 'audio/mp4';
        if (hint.includes('.webm')) return 'audio/webm';
        return response.headers.get('content-type') || 'audio/mp4';
      })();

      const blob = new Blob([buffer], { type: inferredType });
      
      // Revoke old blob URL if exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      
      // Create new blob URL
      const blobUrl = URL.createObjectURL(blob);
      blobUrlRef.current = blobUrl;
      
      // Create and configure audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      const audio = audioRef.current;
      audio.src = blobUrl;
      audio.preload = 'auto';
      audio.playbackRate = playbackRate;
      audio.muted = false;
      audio.volume = 1;
      
      // Wait for audio to be ready (canplay is more reliable than canplaythrough on iOS)
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve();
        };
        const onError = () => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('error', onError);
          reject(new Error('Audio load failed'));
        };
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('error', onError);
        audio.load();
      });
      
      setIsLoaded(true);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Failed to load audio:', err);
      setError(true);
      setIsLoading(false);
    }
  }, [audioUrl, playbackRate]);

  // Setup audio event listeners
  useEffect(() => {
    loadAudioBlob();
    
    return () => {
      // Cleanup
      if (progressInterval.current) {
        cancelAnimationFrame(progressInterval.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [loadAudioBlob]);

  // Handle audio end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (progressInterval.current) {
        cancelAnimationFrame(progressInterval.current);
      }
    };
    
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [isLoaded]);

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
    if (!audioRef.current || !isLoaded) return;
    
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
      // Try reloading the audio
      setIsLoaded(false);
      await loadAudioBlob();
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

  // Prefer the stored duration (voice_duration) if the browser reports a shorter duration
  const browserDuration = audioRef.current?.duration;
  const actualDuration = (() => {
    const bd = typeof browserDuration === 'number' && Number.isFinite(browserDuration) ? browserDuration : 0;
    if (duration && duration > 0) {
      return bd > 0 && bd + 1 >= duration ? bd : duration;
    }
    return bd;
  })();
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
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
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