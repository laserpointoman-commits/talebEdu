import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { CallState, callService } from '@/services/callService';
import { WHATSAPP_COLORS } from './WhatsAppTheme';

interface CallScreenProps {
  isArabic?: boolean;
}

export function CallScreen({ isArabic }: CallScreenProps) {
  const [callState, setCallState] = useState<CallState>(callService.getState());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const unsubscribe = callService.subscribe(setCallState);
    return () => { unsubscribe(); };
  }, []);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
    // For voice calls, attach remote stream to audio element
    if (remoteAudioRef.current && callState.remoteStream) {
      remoteAudioRef.current.srcObject = callState.remoteStream;
      // Auto-play is often blocked; try to play
      remoteAudioRef.current.play().catch((e) => {
        console.warn('Remote audio autoplay blocked:', e);
      });
    }
  }, [callState.localStream, callState.remoteStream]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.status === 'connected' && callState.startTime) {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - callState.startTime!.getTime()) / 1000);
        setCallDuration(seconds);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState.status, callState.startTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    console.log('[CallScreen] toggle mute');
    const muted = callService.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = () => {
    console.log('[CallScreen] toggle video');
    const videoOff = callService.toggleVideo();
    setIsVideoOff(videoOff);
  };

  const handleToggleSpeaker = () => {
    console.log('[CallScreen] toggle speaker');
    callService.toggleSpeaker();
    setIsSpeakerOn(!isSpeakerOn);
  };

  const handleAccept = () => {
    console.log('[CallScreen] accept');
    callService.acceptCall().catch((e) => console.error('[CallScreen] acceptCall failed', e));
  };

  const handleReject = () => {
    console.log('[CallScreen] reject');
    callService.rejectCall().catch((e) => console.error('[CallScreen] rejectCall failed', e));
  };

  const handleEndCall = () => {
    console.log('[CallScreen] end call');
    callService.endCall().catch((e) => console.error('[CallScreen] endCall failed', e));
  };

  const getStatusText = () => {
    switch (callState.status) {
      case 'calling':
        return isArabic ? 'جاري الاتصال...' : 'Calling...';
      case 'ringing':
        return isArabic ? 'مكالمة واردة' : 'Incoming call';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return isArabic ? 'انتهت المكالمة' : 'Call ended';
      default:
        return '';
    }
  };

  if (callState.status === 'idle') {
    return null;
  }

  const isVideoCall = callState.callType === 'video';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col"
        dir="ltr"
        style={{ 
          backgroundColor: isVideoCall ? '#000' : WHATSAPP_COLORS.bg,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Hidden audio element for voice calls - plays remote audio stream */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {/* Video Streams (for video calls) */}
        {isVideoCall && (
          <>
            {/* Remote Video (Full Screen) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 z-0 h-full w-full object-cover pointer-events-none"
            />
            
            {/* Local Video (Picture-in-Picture) */}
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              className="absolute top-20 right-4 z-20 h-44 w-32 overflow-hidden rounded-2xl border-2 border-white/30 shadow-lg"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            </motion.div>
          </>
        )}

        {/* Voice Call UI / Video Call Overlay */}
        <div className={`relative z-10 flex flex-1 flex-col items-center justify-center ${isVideoCall ? 'bg-black/40' : ''}`}>
          {/* Close button for ringing state */}
          {callState.status === 'ringing' && !callState.isIncoming && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 rounded-full"
              onClick={handleEndCall}
            >
              <X className="h-6 w-6 text-white" />
            </Button>
          )}

          {/* Avatar (for voice calls or when video is off) */}
          {(!isVideoCall || isVideoOff || callState.status !== 'connected') && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8"
            >
              <div 
                className="relative"
                style={{
                  background: callState.status === 'ringing' 
                    ? `conic-gradient(from 0deg, ${WHATSAPP_COLORS.accent}, ${WHATSAPP_COLORS.accentLight}, ${WHATSAPP_COLORS.accent})`
                    : 'transparent',
                  padding: callState.status === 'ringing' ? 4 : 0,
                  borderRadius: '50%',
                }}
              >
                <Avatar className="h-32 w-32 border-4 border-white/20">
                  <AvatarImage src={callState.remoteUserImage || undefined} />
                  <AvatarFallback 
                    className="text-4xl font-bold"
                    style={{ backgroundColor: WHATSAPP_COLORS.accent }}
                  >
                    {callState.remoteUserName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Pulsing ring for calling state */}
                {callState.status === 'calling' && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-4"
                      style={{ borderColor: WHATSAPP_COLORS.accent }}
                      animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4"
                      style={{ borderColor: WHATSAPP_COLORS.accent }}
                      animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Name and Status */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              {callState.remoteUserName}
            </h2>
            <p className="text-white/70 text-lg">
              {getStatusText()}
            </p>
            {callState.callType === 'video' && (
              <p className="text-white/50 text-sm mt-1">
                {isArabic ? 'مكالمة فيديو' : 'Video call'}
              </p>
            )}
          </motion.div>
        </div>

        {/* Call Controls */}
        <div 
          className="relative z-30 pb-12 pt-6 px-6"
          style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}
        >
          {/* Incoming call: Accept/Reject */}
          {callState.status === 'ringing' && callState.isIncoming && (
            <div className="flex items-center justify-center gap-16">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
                  onClick={handleReject}
                >
                  <PhoneOff className="h-7 w-7 text-white" />
                </Button>
                <span className="text-white/70 text-sm">
                  {isArabic ? 'رفض' : 'Decline'}
                </span>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full shadow-lg"
                  style={{ backgroundColor: WHATSAPP_COLORS.accent }}
                  onClick={handleAccept}
                >
                  {isVideoCall ? (
                    <Video className="h-7 w-7 text-white" />
                  ) : (
                    <Phone className="h-7 w-7 text-white" />
                  )}
                </Button>
                <span className="text-white/70 text-sm">
                  {isArabic ? 'قبول' : 'Accept'}
                </span>
              </motion.div>
            </div>
          )}

          {/* Active call controls */}
          {(callState.status === 'calling' || callState.status === 'connected') && (
            <div className="flex items-center justify-center gap-6">
              {/* Mute */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <Button
                  size="lg"
                  variant="ghost"
                  className={`h-14 w-14 rounded-full ${isMuted ? 'bg-white' : 'bg-white/20'}`}
                  onClick={handleToggleMute}
                >
                  {isMuted ? (
                    <MicOff className="h-6 w-6 text-black" />
                  ) : (
                    <Mic className="h-6 w-6 text-white" />
                  )}
                </Button>
                <span className="text-white/70 text-xs">
                  {isMuted ? (isArabic ? 'إلغاء الكتم' : 'Unmute') : (isArabic ? 'كتم' : 'Mute')}
                </span>
              </motion.div>

              {/* Video toggle (for video calls) */}
              {isVideoCall && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.05 }}
                  className="flex flex-col items-center gap-2"
                >
                  <Button
                    size="lg"
                    variant="ghost"
                    className={`h-14 w-14 rounded-full ${isVideoOff ? 'bg-white' : 'bg-white/20'}`}
                    onClick={handleToggleVideo}
                  >
                    {isVideoOff ? (
                      <VideoOff className="h-6 w-6 text-black" />
                    ) : (
                      <Video className="h-6 w-6 text-white" />
                    )}
                  </Button>
                  <span className="text-white/70 text-xs">
                    {isVideoOff ? (isArabic ? 'إظهار' : 'Show') : (isArabic ? 'إخفاء' : 'Hide')}
                  </span>
                </motion.div>
              )}

              {/* Speaker */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <Button
                  size="lg"
                  variant="ghost"
                  className={`h-14 w-14 rounded-full ${isSpeakerOn ? 'bg-white' : 'bg-white/20'}`}
                  onClick={handleToggleSpeaker}
                >
                  {isSpeakerOn ? (
                    <Volume2 className="h-6 w-6 text-black" />
                  ) : (
                    <VolumeX className="h-6 w-6 text-white" />
                  )}
                </Button>
                <span className="text-white/70 text-xs">
                  {isArabic ? 'مكبر الصوت' : 'Speaker'}
                </span>
              </motion.div>

              {/* End Call */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col items-center gap-2"
              >
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6 text-white" />
                </Button>
                <span className="text-white/70 text-xs">
                  {isArabic ? 'إنهاء' : 'End'}
                </span>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
