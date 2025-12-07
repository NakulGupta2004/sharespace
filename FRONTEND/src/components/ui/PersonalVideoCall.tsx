import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface PersonalVideoCallProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
  incoming?: boolean;
}

export const PersonalVideoCall: React.FC<PersonalVideoCallProps> = ({
  recipientId,
  recipientName,
  onClose,
  incoming = false
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callActive, setCallActive] = useState(true);
  const [callConnected, setCallConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callIdRef = useRef(`call-${user?.id}-${recipientId}-${Date.now()}`);

  // Initialize local stream and setup peer connection
  useEffect(() => {
    const initializeCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup peer connection
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });

        peerConnectionRef.current = peerConnection;

        // Add local stream tracks
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket?.emit('personalCall:ice-candidate', {
              to: recipientId,
              candidate: event.candidate,
              from: user?.id,
              callId: callIdRef.current
            });
          }
        };

        // Listen for call events
        socket?.on('personalCall:offer', handleOffer);
        socket?.on('personalCall:answer', handleAnswer);
        socket?.on('personalCall:ice-candidate', handleIceCandidate);
        socket?.on('personalCall:accepted', handleCallAccepted);
        socket?.on('personalCall:rejected', handleCallRejected);
        socket?.on('personalCall:ended', handleCallEnded);

        if (!incoming) {
          // Initiate call
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket?.emit('personalCall:initiate', {
            to: recipientId,
            offer,
            from: user?.id,
            fromName: user?.name,
            callId: callIdRef.current
          });
        }

        return () => {
          socket?.off('personalCall:offer', handleOffer);
          socket?.off('personalCall:answer', handleAnswer);
          socket?.off('personalCall:ice-candidate', handleIceCandidate);
          socket?.off('personalCall:accepted', handleCallAccepted);
          socket?.off('personalCall:rejected', handleCallRejected);
          socket?.off('personalCall:ended', handleCallEnded);
        };
      } catch (err) {
        setError('Unable to access camera/microphone. Please check permissions.');
        console.error('Error accessing media devices:', err);
      }
    };

    initializeCall();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      remoteStream?.getTracks().forEach(track => track.stop());
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.getSenders().forEach((sender: any) => {
          if (sender.track) sender.track.stop();
        });
        peerConnectionRef.current.close();
      }
      
      // Clear video element refs
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [recipientId, user, socket, incoming]);

  const handleOffer = async (data: {
    offer: RTCSessionDescriptionInit;
    from: string;
    callId: string;
  }) => {
    if (peerConnectionRef.current && !callConnected) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket?.emit('personalCall:answer', {
        to: data.from,
        answer,
        from: user?.id,
        callId: data.callId
      });
    }
  };

  const handleAnswer = async (data: {
    answer: RTCSessionDescriptionInit;
    from: string;
  }) => {
    if (peerConnectionRef.current && !callConnected) {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
      setCallConnected(true);
    }
  };

  const handleIceCandidate = async (data: {
    candidate: RTCIceCandidateInit;
    from: string;
  }) => {
    if (peerConnectionRef.current && data.candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  };

  const handleCallAccepted = () => {
    setCallConnected(true);
  };

  const handleCallRejected = () => {
    setError('Call was rejected');
    setTimeout(() => {
      endCall();
    }, 2000);
  };

  const handleCallEnded = () => {
    setCallActive(false);
  };

  const acceptCall = async () => {
    if (peerConnectionRef.current) {
      setCallConnected(true);
      socket?.emit('personalCall:accept', {
        to: recipientId,
        from: user?.id,
        callId: callIdRef.current
      });
    }
  };

  const rejectCall = () => {
    socket?.emit('personalCall:reject', {
      to: recipientId,
      from: user?.id,
      callId: callIdRef.current
    });
    endCall();
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const endCall = () => {
    setCallActive(false);

    // Close peer connection and stop all tracks
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach(sender => {
        sender.track?.stop();
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local stream and all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    // Stop remote stream tracks
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    // Clear video refs
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    socket?.emit('personalCall:end', {
      to: recipientId,
      from: user?.id,
      callId: callIdRef.current
    });

    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {callActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gray-900 flex flex-col"
        >
          {/* Header */}
          <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{recipientName}</h2>
              <p className="text-sm text-gray-400">
                {callConnected ? 'Connected' : 'Connecting...'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={endCall}
              className="p-2 hover:bg-red-600 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </motion.button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500 text-white px-4 py-3 m-4 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Video Container */}
          <div className="flex-1 overflow-auto bg-gray-900 p-4 flex items-center justify-center">
            {/* Incoming Call - Waiting for acceptance */}
            {incoming && !callConnected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Phone className="h-12 w-12 text-white" />
                </motion.div>
                <p className="text-white text-xl mb-8">Incoming call from {recipientName}</p>
              </motion.div>
            )}

            {/* Video Grid */}
            {callConnected && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
                {/* Local Video - Picture in Picture when connected */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-800 rounded-2xl overflow-hidden relative w-full h-full"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-lg text-white text-sm">
                    You
                  </div>
                  {!videoEnabled && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <VideoOff className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </motion.div>

                {/* Remote Video */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-800 rounded-2xl overflow-hidden relative w-full h-full"
                >
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-lg text-white text-sm">
                    {recipientName}
                  </div>
                  {!remoteStream && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <VideoOff className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </motion.div>
              </div>
            )}

            {/* Local Video Only - When waiting or connecting */}
            {!callConnected && !incoming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-2xl overflow-hidden relative w-full max-w-md aspect-video"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-lg text-white text-sm">
                  You
                </div>
                {!videoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
            {incoming && !callConnected && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={rejectCall}
                  className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200"
                  title="Reject call"
                >
                  <PhoneOff className="h-6 w-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={acceptCall}
                  className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all duration-200"
                  title="Accept call"
                >
                  <Phone className="h-6 w-6" />
                </motion.button>
              </>
            )}

            {callConnected && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleAudio}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    audioEnabled
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={audioEnabled ? 'Mute' : 'Unmute'}
                >
                  {audioEnabled ? (
                    <Mic className="h-6 w-6" />
                  ) : (
                    <MicOff className="h-6 w-6" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all duration-200 ${
                    videoEnabled
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={videoEnabled ? 'Stop video' : 'Start video'}
                >
                  {videoEnabled ? (
                    <Video className="h-6 w-6" />
                  ) : (
                    <VideoOff className="h-6 w-6" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={endCall}
                  className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200"
                  title="End call"
                >
                  <PhoneOff className="h-6 w-6" />
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
