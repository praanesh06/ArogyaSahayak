import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const VideoCall = ({ consultationId, userType, socket, onEndCall }) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [browserSupported, setBrowserSupported] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Check browser compatibility and context (HTTPS/localhost requirement)
  useEffect(() => {
    const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
    const isSecure = window.isSecureContext || isLocalhost || window.location.protocol === 'https:';

    if (!isSecure) {
      setBrowserSupported(false);
      setCallStatus('Video calls require HTTPS or localhost. Open via https:// or http://localhost.');
      return;
    }

    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
                           !!(navigator.getUserMedia) ||
                           !!(navigator.webkitGetUserMedia) ||
                           !!(navigator.mozGetUserMedia) ||
                           !!(navigator.msGetUserMedia);

    const hasRTCPeerConnection = !!(window.RTCPeerConnection || 
                                  window.webkitRTCPeerConnection || 
                                  window.mozRTCPeerConnection);

    if (!hasGetUserMedia || !hasRTCPeerConnection) {
      setBrowserSupported(false);
      setCallStatus('Browser APIs unavailable. Update Chrome or enable camera/microphone.');
      return;
    }
  }, []);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
  };

  useEffect(() => {
    if (!socket) return;

    // WebRTC event listeners
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('video-call-started', handleVideoCallStarted);
    socket.on('video-call-ended', handleVideoCallEnded);

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('video-call-started', handleVideoCallStarted);
      socket.off('video-call-ended', handleVideoCallEnded);
    };
  }, [socket]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const initializePeerConnection = () => {
    peerConnectionRef.current = new RTCPeerConnection(iceServers);

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', {
          consultationId,
          candidate: event.candidate,
          senderType: userType
        });
      }
    };

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('Connected');
        setIsCallActive(true);
        startCallTimer();
      }
    };

    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      const state = peerConnectionRef.current.connectionState;
      if (state === 'connected') {
        setCallStatus('Connected');
        setIsCallActive(true);
        startCallTimer();
      } else if (state === 'disconnected' || state === 'failed') {
        setCallStatus('Connection lost');
        setIsCallActive(false);
        stopCallTimer();
      }
    };
  };

  const startVideoCall = async () => {
    try {
      setCallStatus('Starting video call...');
      console.log('Starting video call for consultation:', consultationId);
      
      // Require secure context (HTTPS or localhost)
      const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
      const isSecure = window.isSecureContext || isLocalhost || window.location.protocol === 'https:';
      if (!isSecure) {
        setBrowserSupported(false);
        setCallStatus('Secure context required. Use HTTPS or open via localhost.');
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback for older browsers
        const getUserMedia = navigator.getUserMedia || 
                           navigator.webkitGetUserMedia || 
                           navigator.mozGetUserMedia || 
                           navigator.msGetUserMedia;
        
        if (!getUserMedia) {
          throw new Error('getUserMedia is not supported in this browser');
        }
        
        // Use legacy getUserMedia
        const stream = await new Promise((resolve, reject) => {
          getUserMedia.call(navigator, {
            video: { width: 640, height: 480 },
            audio: true
          }, resolve, reject);
        });
        
        console.log('Got user media stream (legacy):', stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        // Modern getUserMedia
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });
        
        console.log('Got user media stream (modern):', stream);
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }

      // Initialize peer connection
      initializePeerConnection();

      // Add local stream to peer connection
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
        console.log('Added track to peer connection:', track.kind);
      });

      // Create and send offer
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('Created and set local offer');

      socket.emit('webrtc-offer', {
        consultationId,
        offer,
        senderType: userType
      });

      socket.emit('start-video-call', {
        consultationId,
        senderType: userType
      });

      setCallStatus('Call initiated - waiting for answer...');
    } catch (error) {
      console.error('Error starting video call:', error);
      if (error && error.name === 'NotAllowedError') {
        setCallStatus('Camera/Microphone permission denied. Allow access in the browser.');
      } else if (error && error.name === 'NotFoundError') {
        setCallStatus('No camera/microphone found. Connect a device and retry.');
      } else if (error && error.name === 'NotReadableError') {
        setCallStatus('Your camera/microphone is in use by another app.');
      } else {
        setCallStatus(`Failed to start call: ${error.message}`);
      }
    }
  };

  const handleOffer = async (data) => {
    try {
      console.log('Received offer from:', data.senderType);
      if (!peerConnectionRef.current) {
        initializePeerConnection();
      }

      // Get user media if not already done
      if (!localStreamRef.current) {
        let stream;
        // Require secure context (HTTPS or localhost)
        const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
        const isSecure = window.isSecureContext || isLocalhost || window.location.protocol === 'https:';
        if (!isSecure) {
          setBrowserSupported(false);
          setCallStatus('Secure context required. Use HTTPS or open via localhost.');
          return;
        }

        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          // Fallback for older browsers
          const getUserMedia = navigator.getUserMedia || 
                             navigator.webkitGetUserMedia || 
                             navigator.mozGetUserMedia || 
                             navigator.msGetUserMedia;
          
          if (!getUserMedia) {
            throw new Error('getUserMedia is not supported in this browser');
          }
          
          // Use legacy getUserMedia
          stream = await new Promise((resolve, reject) => {
            getUserMedia.call(navigator, {
              video: { width: 640, height: 480 },
              audio: true
            }, resolve, reject);
          });
        } else {
          // Modern getUserMedia
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true
          });
        }
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add local stream to peer connection
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });
      }

      // Set remote description
      await peerConnectionRef.current.setRemoteDescription(data.offer);
      console.log('Set remote description');

      // Create and send answer
      const answer = await peerConnectionRef.current.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log('Created and set local answer');

      socket.emit('webrtc-answer', {
        consultationId,
        answer,
        senderType: userType
      });

      setCallStatus('Answering call...');
    } catch (error) {
      console.error('Error handling offer:', error);
      if (error && error.name === 'NotAllowedError') {
        setCallStatus('Camera/Microphone permission denied. Allow access in the browser.');
      } else if (error && error.name === 'NotFoundError') {
        setCallStatus('No camera/microphone found. Connect a device and retry.');
      } else if (error && error.name === 'NotReadableError') {
        setCallStatus('Your camera/microphone is in use by another app.');
      } else {
        setCallStatus(`Failed to answer call: ${error.message}`);
      }
    }
  };

  const handleAnswer = async (data) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(data.answer);
      setCallStatus('Call connected');
      startCallTimer();
    } catch (error) {
      console.error('Error handling answer:', error);
      setCallStatus('Failed to connect call');
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      if (peerConnectionRef.current && data.candidate) {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const handleVideoCallStarted = (data) => {
    setCallStatus('Incoming video call...');
  };

  const handleVideoCallEnded = (data) => {
    endVideoCall();
  };

  const startCallTimer = () => {
    if (!callStartTime) {
      setCallStartTime(Date.now());
    }
    
    timerIntervalRef.current = setInterval(() => {
      if (callStartTime) {
        const duration = Math.floor((Date.now() - callStartTime) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const stopCallTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setCallStartTime(null);
    setCallDuration(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const endVideoCall = () => {
    // Stop timer
    stopCallTimer();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Notify other participant
    socket.emit('end-video-call', {
      consultationId,
      senderType: userType
    });

    setIsCallActive(false);
    setCallStatus('Call ended');
    
    if (onEndCall) {
      onEndCall();
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  if (!browserSupported) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Video Call</h3>
          <div className="status-badge error">{callStatus}</div>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">Your browser doesn't support video calls.</p>
          <p className="text-sm text-gray-500">Please use Chrome, Firefox, or Safari for the best experience.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      {/* Call Header */}
      <div className="call-header">
        <div className="call-info">
          <h3 className="call-title">Video Consultation</h3>
          <div className="call-status">
            <div className={`status-indicator ${isCallActive ? 'connected' : 'connecting'}`}></div>
            <span className="status-text">{callStatus}</span>
          </div>
        </div>
        <div className="call-timer">
          {isCallActive && <span className="timer">{formatTime(callDuration)}</span>}
        </div>
      </div>

      {/* Video Grid */}
      <div className="video-grid">
        {/* Remote Video - Main View */}
        <div className="video-main">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="video-stream remote-video"
            style={{ display: isCallActive ? 'block' : 'none' }}
          />
          
          {/* Remote Video Placeholder */}
          {!isCallActive && (
            <div className="video-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="placeholder-text">Waiting for connection...</p>
              </div>
            </div>
          )}
          
          {/* Remote User Info Overlay */}
          {isCallActive && (
            <div className="user-info-overlay">
              <div className="user-info">
                <span className="user-name">{userType === 'doctor' ? 'Patient' : 'Dr. Smith'}</span>
                <div className="connection-quality">
                  <div className="quality-indicator excellent"></div>
                  <span>HD</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Local Video - Picture in Picture */}
        <div className="video-pip">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="pip-stream"
          />
          
          {/* Local Video Placeholder */}
          {!localStreamRef.current && (
            <div className="video-placeholder pip-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          
          {/* Local User Info */}
          <div className="pip-user-info">
            <span className="pip-name">You</span>
            <div className="pip-controls">
              {!isVideoEnabled && (
                <div className="control-indicator video-off">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              )}
              {!isAudioEnabled && (
                <div className="control-indicator audio-off">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Controls */}
      <div className="video-controls">
        {!isCallActive ? (
          <button 
            className="btn btn-primary btn-start-call"
            onClick={startVideoCall}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Start Video Call
          </button>
        ) : (
          <div className="call-controls">
            <button 
              className={`control-btn video-btn ${isVideoEnabled ? 'active' : 'inactive'}`}
              onClick={toggleVideo}
              title={isVideoEnabled ? "Turn off video" : "Turn on video"}
            >
              {isVideoEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            
            <button 
              className={`control-btn audio-btn ${isAudioEnabled ? 'active' : 'inactive'}`}
              onClick={toggleAudio}
              title={isAudioEnabled ? "Mute audio" : "Unmute audio"}
            >
              {isAudioEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
            
            <button 
              className="control-btn end-btn"
              onClick={endVideoCall}
              title="End call"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;