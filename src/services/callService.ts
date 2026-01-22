import { supabase } from '@/integrations/supabase/client';

export interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  callId: string | null;
  callType: 'voice' | 'video';
  isIncoming: boolean;
  remoteUserId: string | null;
  remoteUserName: string | null;
  remoteUserImage: string | null;
  startTime: Date | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

export type CallEventHandler = (state: CallState) => void;

class CallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callChannel: ReturnType<typeof supabase.channel> | null = null;
  private currentUserId: string | null = null;
  private callState: CallState = {
    status: 'idle',
    callId: null,
    callType: 'voice',
    isIncoming: false,
    remoteUserId: null,
    remoteUserName: null,
    remoteUserImage: null,
    startTime: null,
    localStream: null,
    remoteStream: null,
  };
  private stateListeners: Set<CallEventHandler> = new Set();
  private ringtoneAudio: HTMLAudioElement | null = null;

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  constructor() {
    // Create ringtone audio element
    if (typeof window !== 'undefined') {
      this.ringtoneAudio = new Audio();
      this.ringtoneAudio.loop = true;
    }
  }

  // Subscribe to call state changes
  subscribe(handler: CallEventHandler) {
    this.stateListeners.add(handler);
    handler(this.callState);
    return () => this.stateListeners.delete(handler);
  }

  private notifyStateChange() {
    this.stateListeners.forEach(handler => handler({ ...this.callState }));
  }

  private updateState(updates: Partial<CallState>) {
    this.callState = { ...this.callState, ...updates };
    this.notifyStateChange();
  }

  // Initialize the service with current user
  async initialize(userId: string) {
    // If re-initializing (route changes, hot reload), clean up old listener.
    if (this.callChannel) {
      try {
        supabase.removeChannel(this.callChannel);
      } catch {
        // ignore
      }
      this.callChannel = null;
    }

    this.currentUserId = userId;
    await this.setupCallListener();
  }

  private waitForChannelSubscribed(channel: ReturnType<typeof supabase.channel>) {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error('Realtime channel subscribe timed out'));
      }, 8000);

      channel.subscribe((status) => {
        if (settled) return;

        if (status === 'SUBSCRIBED') {
          settled = true;
          window.clearTimeout(timeout);
          resolve();
        }

        if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          settled = true;
          window.clearTimeout(timeout);
          reject(new Error(`Realtime channel subscribe failed: ${status}`));
        }
      });
    });
  }

  private async sendSignal(toUserId: string, event: string, payload: any) {
    const ch = supabase.channel(`calls:${toUserId}`);

    try {
      await this.waitForChannelSubscribed(ch);
      await ch.send({
        type: 'broadcast',
        event,
        payload,
      });
    } finally {
      try {
        supabase.removeChannel(ch);
      } catch {
        // ignore
      }
    }
  }

  // Set up listener for incoming calls
  private async setupCallListener() {
    if (!this.currentUserId) return;

    // Subscribe to call signals directed at this user
    this.callChannel = supabase.channel(`calls:${this.currentUserId}`)
      .on('broadcast', { event: 'call-offer' }, async (payload) => {
        console.log('Received call offer:', payload);
        await this.handleIncomingCall(payload.payload);
      })
      .on('broadcast', { event: 'call-answer' }, async (payload) => {
        console.log('Received call answer:', payload);
        await this.handleCallAnswer(payload.payload);
      })
      .on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        console.log('Received ICE candidate:', payload);
        await this.handleIceCandidate(payload.payload);
      })
      .on('broadcast', { event: 'call-end' }, async (payload) => {
        console.log('Received call end:', payload);
        this.handleCallEnded();
      })
      .on('broadcast', { event: 'call-reject' }, async (payload) => {
        console.log('Call rejected:', payload);
        this.handleCallRejected();
      })
      .subscribe();
  }

  // Start an outgoing call
  async startCall(
    recipientId: string,
    recipientName: string,
    recipientImage: string | null,
    callType: 'voice' | 'video'
  ) {
    if (!this.currentUserId) {
      throw new Error('Call service not initialized');
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Check if getUserMedia is available (iOS compatibility)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported on this device');
      }

      // Get local media stream with error handling for iOS
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
      } catch (mediaError: any) {
        console.error('Media access error:', mediaError);
        // Fallback to audio only if video fails
        if (callType === 'video') {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } else {
          throw mediaError;
        }
      }

      this.updateState({
        status: 'calling',
        callId,
        callType,
        isIncoming: false,
        remoteUserId: recipientId,
        remoteUserName: recipientName,
        remoteUserImage: recipientImage,
        localStream: this.localStream,
      });

      // Create peer connection
      await this.createPeerConnection();

      // Add local tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Send offer to recipient via broadcast (wait for SUBSCRIBED on Android WebViews)
      await this.sendSignal(recipientId, 'call-offer', {
        callId,
        callType,
        callerId: this.currentUserId,
        callerName: '',
        offer: offer.sdp,
      });

      // Log call attempt (wrapped in try-catch for safety)
      try {
        await supabase.from('call_logs').insert({
          caller_id: this.currentUserId,
          recipient_id: recipientId,
          call_type: callType,
          status: 'calling',
          started_at: new Date().toISOString(),
        });
      } catch (logError) {
        console.warn('Could not log call:', logError);
      }

      console.log('Call offer sent to:', recipientId);
    } catch (error) {
      console.error('Error starting call:', error);
      this.cleanup();
      this.resetState();
      throw error;
    }
  }

  // Handle incoming call
  private async handleIncomingCall(data: any) {
    const { callId, callType, callerId, offer } = data;

    console.log('[CallService] handleIncomingCall triggered:', { callId, callType, callerId });
    console.log('[CallService] Current path:', window.location.pathname);

    // Fetch caller info
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('full_name, profile_image')
      .eq('id', callerId)
      .single();

    this.updateState({
      status: 'ringing',
      callId,
      callType,
      isIncoming: true,
      remoteUserId: callerId,
      remoteUserName: callerProfile?.full_name || 'Unknown',
      remoteUserImage: callerProfile?.profile_image || null,
    });

    // Store the offer for when user accepts
    (this.callState as any).pendingOffer = offer;

    // Check if we're on a device page (CM30 kiosk mode) - auto-answer immediately
    const isDevicePage = window.location.pathname.startsWith('/device/');
    console.log('[CallService] Is device page?', isDevicePage);
    
    if (isDevicePage) {
      console.log('[CallService] CM30 device mode detected - auto-answering call in 300ms');
      // Small delay to ensure state is updated, then auto-accept
      setTimeout(() => {
        console.log('[CallService] Executing auto-accept now');
        this.acceptCall().catch((e) => console.error('Auto-accept failed:', e));
      }, 300);
      return;
    }

    // Normal mode: Play ringtone and wait for user interaction
    console.log('[CallService] Normal mode - playing ringtone');
    this.playRingtone();
  }

  // Accept incoming call
  async acceptCall() {
    if (this.callState.status !== 'ringing' || !this.callState.remoteUserId) {
      return;
    }

    this.stopRingtone();

    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: this.callState.callType === 'video',
      });

      this.updateState({
        localStream: this.localStream,
      });

      // Create peer connection
      await this.createPeerConnection();

      // Add local tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      // Set remote description from offer
      const offer = (this.callState as any).pendingOffer;
      await this.peerConnection!.setRemoteDescription({
        type: 'offer',
        sdp: offer,
      });

      // Create and send answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Send answer to caller
      await this.sendSignal(this.callState.remoteUserId, 'call-answer', {
        callId: this.callState.callId,
        answer: answer.sdp,
      });

      this.updateState({
        status: 'connected',
        startTime: new Date(),
      });

      console.log('Call accepted and answer sent');
    } catch (error) {
      console.error('Error accepting call:', error);
      this.endCall();
    }
  }

  // Reject incoming call
  async rejectCall() {
    if (this.callState.status !== 'ringing' || !this.callState.remoteUserId) {
      return;
    }

    this.stopRingtone();

    // Send rejection to caller
    await this.sendSignal(this.callState.remoteUserId, 'call-reject', {
      callId: this.callState.callId,
    });

    // Log as missed call
    if (this.callState.callId) {
      await supabase.from('call_logs')
        .update({ status: 'declined' })
        .eq('id', this.callState.callId);
    }

    this.resetState();
  }

  // Handle call answer from recipient
  private async handleCallAnswer(data: any) {
    const { answer } = data;

    if (this.peerConnection && this.callState.status === 'calling') {
      await this.peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answer,
      });

      this.updateState({
        status: 'connected',
        startTime: new Date(),
      });

      console.log('Call connected');
    }
  }

  // Handle ICE candidate
  private async handleIceCandidate(data: any) {
    const { candidate } = data;

    if (this.peerConnection && candidate) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  // Handle call ended by remote
  private handleCallEnded() {
    this.stopRingtone();
    this.cleanup();
    this.updateState({
      status: 'ended',
    });

    // Reset after showing ended state
    setTimeout(() => this.resetState(), 2000);
  }

  // Handle call rejected
  private handleCallRejected() {
    this.cleanup();
    this.updateState({
      status: 'ended',
    });

    setTimeout(() => this.resetState(), 2000);
  }

  // End the current call
  async endCall() {
    if (this.callState.remoteUserId) {
      // Notify remote user
      await this.sendSignal(this.callState.remoteUserId, 'call-end', {
        callId: this.callState.callId,
      });
    }

    // Log call end
    if (this.callState.callId && this.callState.startTime) {
      const duration = Math.floor((Date.now() - this.callState.startTime.getTime()) / 1000);
      await supabase.from('call_logs')
        .update({
          status: 'answered',
          ended_at: new Date().toISOString(),
          duration,
        })
        .eq('id', this.callState.callId);
    }

    this.stopRingtone();
    this.cleanup();
    this.resetState();
  }

  // Toggle mute
  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle video
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  // Toggle speaker (placeholder - actual implementation depends on platform)
  toggleSpeaker(): boolean {
    // This would require platform-specific implementation
    return false;
  }

  // Create peer connection
  private async createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.rtcConfig);

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event);
      this.remoteStream = event.streams[0];
      this.updateState({
        remoteStream: this.remoteStream,
      });
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate && this.callState.remoteUserId) {
        try {
          await this.sendSignal(this.callState.remoteUserId, 'ice-candidate', {
            callId: this.callState.callId,
            candidate: event.candidate.toJSON(),
          });
        } catch (e) {
          console.warn('Failed to send ICE candidate:', e);
        }
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'disconnected' ||
          this.peerConnection?.connectionState === 'failed') {
        this.endCall();
      }
    };
  }

  // Play ringtone
  private playRingtone() {
    // Using a simple oscillator as ringtone (could be replaced with actual audio file)
    if (typeof window !== 'undefined') {
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        
        // Store for later stopping
        (this as any).ringtoneContext = audioContext;
        (this as any).ringtoneOscillator = oscillator;
      } catch (e) {
        console.log('Could not play ringtone');
      }
    }
  }

  // Stop ringtone
  private stopRingtone() {
    try {
      (this as any).ringtoneOscillator?.stop();
      (this as any).ringtoneContext?.close();
    } catch (e) {
      // Ignore
    }
  }

  // Cleanup resources with iOS-safe error handling
  private cleanup() {
    try {
      // Safely stop local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error stopping track:', e);
          }
        });
        this.localStream = null;
      }
      
      // Safely stop remote stream tracks
      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error stopping remote track:', e);
          }
        });
        this.remoteStream = null;
      }
      
      // Safely close peer connection
      if (this.peerConnection) {
        try {
          this.peerConnection.close();
        } catch (e) {
          console.warn('Error closing peer connection:', e);
        }
        this.peerConnection = null;
      }
    } catch (error) {
      console.error('Cleanup error (non-fatal):', error);
    }
  }

  // Reset state
  private resetState() {
    this.updateState({
      status: 'idle',
      callId: null,
      callType: 'voice',
      isIncoming: false,
      remoteUserId: null,
      remoteUserName: null,
      remoteUserImage: null,
      startTime: null,
      localStream: null,
      remoteStream: null,
    });
  }

  // Get current state
  getState(): CallState {
    return { ...this.callState };
  }
}

// Singleton instance
export const callService = new CallService();
