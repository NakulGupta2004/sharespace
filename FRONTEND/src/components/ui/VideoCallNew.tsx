import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface VideoCallProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
  isTeamCall: boolean;
  initiatorId?: string;
  callId?: string;
}

interface Participant {
  userId: string;
  userName: string;
  stream?: MediaStream;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export const VideoCallNew: React.FC<VideoCallProps> = ({
  teamId,
  teamName,
  onClose,
  isTeamCall,
  initiatorId,
  callId: incomingCallId
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  
  // State management
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const callIdRef = useRef(incomingCallId || `${teamId}-${user?.id}-${Date.now()}`);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isInitiatorRef = useRef(user?.id === initiatorId);
  const callStartedRef = useRef(false);

  // Get user media stream
  useEffect(() => {
    const startCall = async () => {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
        } catch (err) {
          console.log('High-res failed, trying basic constraints...');
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }

        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Only the initiator sends the join signal
        if (isInitiatorRef.current && !callStartedRef.current) {
          callStartedRef.current = true;
          socket?.emit('videoCall:start', {
            teamId,
            userId: user?.id,
            userName: user?.name,
            callId: callIdRef.current,
            isTeamCall
          });
        }
      } catch (err) {
        console.error('Media error:', err);
        setError(`Unable to access camera/microphone: ${err instanceof DOMException ? err.message : 'Please check permissions.'}`);
      }
    };

    startCall();

    return () => {
      localStream?.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
    };
  }, []);

  // Handle user joined event
  const handleUserJoined = (data: { userId: string; userName: string; callId: string }) => {
    if (data.userId === user?.id) return;

    setParticipants(prev => {
      if (prev.some(p => p.userId === data.userId)) return prev;
      return [...prev, {
        userId: data.userId,
        userName: data.userName,
        videoEnabled: true,
        audioEnabled: true
      }];
    });

    // Create peer connection and send offer
    if (localStream) {
      createAndSendOffer(data.userId);
    }
  };

  // Handle user left
  const handleUserLeft = (data: { userId: string }) => {
    setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    if (peerConnectionsRef.current[data.userId]) {
      peerConnectionsRef.current[data.userId].close();
      delete peerConnectionsRef.current[data.userId];
    }
    if (remoteVideoRefs.current[data.userId]) {
      remoteVideoRefs.current[data.userId] = null;
    }
  };

  // Create peer connection and send offer
  const createAndSendOffer = async (peerId: string) => {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionsRef.current[peerId] = peerConnection;

      // Add local stream
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        setParticipants(prev =>
          prev.map(p => (p.userId === peerId ? { ...p, stream: event.streams[0] } : p))
        );
        if (remoteVideoRefs.current[peerId]) {
          remoteVideoRefs.current[peerId]!.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit('videoCall:ice-candidate', {
            to: peerId,
            from: user?.id,
            candidate: event.candidate,
            teamId
          });
        }
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket?.emit('videoCall:offer', {
        to: peerId,
        from: user?.id,
        fromName: user?.name,
        offer,
        teamId,
        callId: callIdRef.current
      });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  // Handle incoming offer
  const handleOffer = async (data: {
    offer: RTCSessionDescriptionInit;
    from: string;
    fromName: string;
  }) => {
    try {
      if (!peerConnectionsRef.current[data.from]) {
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });

        peerConnectionsRef.current[data.from] = peerConnection;

        if (localStream) {
          localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
          });
        }

        peerConnection.ontrack = (event) => {
          setParticipants(prev =>
            prev.map(p => (p.userId === data.from ? { ...p, stream: event.streams[0] } : p))
          );
          if (remoteVideoRefs.current[data.from]) {
            remoteVideoRefs.current[data.from]!.srcObject = event.streams[0];
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket?.emit('videoCall:ice-candidate', {
              to: data.from,
              from: user?.id,
              candidate: event.candidate,
              teamId
            });
          }
        };
      }

      const peerConnection = peerConnectionsRef.current[data.from];
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket?.emit('videoCall:answer', {
        to: data.from,
        from: user?.id,
        answer,
        teamId
      });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  // Handle incoming answer
  const handleAnswer = async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
    try {
      const peerConnection = peerConnectionsRef.current[data.from];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };

  // Handle ICE candidates
  const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; from: string }) => {
    try {
      const peerConnection = peerConnectionsRef.current[data.from];
      if (peerConnection && data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  };

  // Handle audio toggle
  const handleAudioToggled = (data: { userId: string; enabled: boolean }) => {
    setParticipants(prev =>
      prev.map(p => (p.userId === data.userId ? { ...p, audioEnabled: data.enabled } : p))
    );
  };

  // Handle video toggle
  const handleVideoToggled = (data: { userId: string; enabled: boolean }) => {
    setParticipants(prev =>
      prev.map(p => (p.userId === data.userId ? { ...p, videoEnabled: data.enabled } : p))
    );
  };

  // Handle chat message
  const handleChatMessage = (data: {
    userId: string;
    userName: string;
    message: string;
    teamId: string;
  }) => {
    if (data.teamId === teamId) {
      setChatMessages(prev => [
        ...prev,
        {
          userId: data.userId,
          userName: data.userName,
          message: data.message,
          timestamp: Date.now()
        }
      ]);
    }
  };

  // Register socket listeners
  useEffect(() => {
    socket?.on('videoCall:user-joined', handleUserJoined);
    socket?.on('videoCall:user-left', handleUserLeft);
    socket?.on('videoCall:offer', handleOffer);
    socket?.on('videoCall:answer', handleAnswer);
    socket?.on('videoCall:ice-candidate', handleIceCandidate);
    socket?.on('videoCall:audio-toggled', handleAudioToggled);
    socket?.on('videoCall:video-toggled', handleVideoToggled);
    socket?.on('videoCall:chat', handleChatMessage);

    return () => {
      socket?.off('videoCall:user-joined', handleUserJoined);
      socket?.off('videoCall:user-left', handleUserLeft);
      socket?.off('videoCall:offer', handleOffer);
      socket?.off('videoCall:answer', handleAnswer);
      socket?.off('videoCall:ice-candidate', handleIceCandidate);
      socket?.off('videoCall:audio-toggled', handleAudioToggled);
      socket?.off('videoCall:video-toggled', handleVideoToggled);
      socket?.off('videoCall:chat', handleChatMessage);
    };
  }, [socket]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const newState = !audioEnabled;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
      setAudioEnabled(newState);

      socket?.emit('videoCall:toggle-audio', {
        teamId,
        userId: user?.id,
        enabled: newState
      });
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const newState = !videoEnabled;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
      setVideoEnabled(newState);

      socket?.emit('videoCall:toggle-video', {
        teamId,
        userId: user?.id,
        enabled: newState
      });
    }
  };

  // Send chat message
  const sendChatMessage = () => {
    if (chatInput.trim()) {
      socket?.emit('videoCall:chat', {
        teamId,
        userId: user?.id,
        userName: user?.name,
        message: chatInput
      });

      setChatMessages(prev => [
        ...prev,
        {
          userId: user?.id || '',
          userName: user?.name || 'You',
          message: chatInput,
          timestamp: Date.now()
        }
      ]);

      setChatInput('');
    }
  };

  // End call
  const endCall = () => {
    // Stop all tracks
    localStream?.getTracks().forEach(track => {
      track.enabled = false;
      track.stop();
    });

    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => {
      if (pc) {
        pc.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.enabled = false;
            sender.track.stop();
          }
        });
        pc.getReceivers().forEach(receiver => {
          if (receiver.track) {
            receiver.track.enabled = false;
            receiver.track.stop();
          }
        });
        pc.close();
      }
    });

    peerConnectionsRef.current = {};
    remoteVideoRefs.current = {};

    // Clear refs
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Notify others
    socket?.emit('videoCall:end', {
      teamId,
      userId: user?.id,
      callId: callIdRef.current
    });

    setTimeout(() => {
      onClose();
    }, 100);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gray-950 flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 flex items-center justify-between border-b border-gray-700 shadow-lg">
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {teamName}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              🎥 {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-full transition-all ${
                showChat ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              } text-white`}
              title="Toggle chat"
            >
              <MessageCircle className="h-6 w-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={endCall}
              className="p-2 hover:bg-red-600 rounded-full transition-colors"
              title="End call"
            >
              <X className="h-6 w-6" />
            </motion.button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 mx-4 mt-4 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Video Grid Area */}
          <div className={`flex-1 overflow-auto bg-gradient-to-b from-gray-900 to-gray-950 p-4 transition-all ${showChat ? 'mr-4' : ''}`}>
            <div
              className={`grid gap-4 h-full content-start ${
                participants.length === 0
                  ? 'grid-cols-1'
                  : participants.length === 1
                  ? 'grid-cols-1 md:grid-cols-2'
                  : participants.length <= 2
                  ? 'grid-cols-2'
                  : participants.length <= 4
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
              }`}
            >
              {/* Local Video */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-2xl overflow-hidden relative aspect-video shadow-lg border border-gray-700 hover:border-blue-500 transition-colors"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg text-white text-sm font-medium backdrop-blur-md border border-white/10">
                  📹 {user?.name} (You)
                </div>
                {!videoEnabled && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <VideoOff className="h-16 w-16 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Camera off</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Remote Videos */}
              {participants.map(participant => (
                <motion.div
                  key={participant.userId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-gray-800 rounded-2xl overflow-hidden relative aspect-video shadow-lg border border-gray-700 hover:border-cyan-400 transition-colors"
                >
                  <video
                    ref={el => {
                      if (el) remoteVideoRefs.current[participant.userId] = el;
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg text-white text-sm font-medium backdrop-blur-md border border-white/10">
                    👤 {participant.userName}
                  </div>
                  <div className="absolute top-3 right-3 flex space-x-1">
                    {!participant.audioEnabled && (
                      <div className="bg-red-500/80 p-1.5 rounded-full backdrop-blur-md">
                        <MicOff className="h-4 w-4 text-white" />
                      </div>
                    )}
                    {!participant.videoEnabled && (
                      <div className="bg-red-500/80 p-1.5 rounded-full backdrop-blur-md">
                        <VideoOff className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  {!participant.videoEnabled && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center backdrop-blur-sm">
                      <VideoOff className="h-16 w-16 text-gray-500" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chat Panel */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, x: 400 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 400 }}
                className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col shadow-2xl"
              >
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 border-b border-gray-700">
                  <h3 className="text-white font-semibold flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-blue-400" />
                    Team Chat
                  </h3>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg ${
                            msg.userId === user?.id
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-gray-800 text-gray-100 rounded-bl-none'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {msg.userId === user?.id ? 'You' : msg.userName}
                          </p>
                          <p className="break-words text-sm">{msg.message}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-700 bg-gray-900">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendChatMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                    >
                      <Send className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex items-center justify-center space-x-4 border-t border-gray-700 shadow-lg">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-all duration-200 font-medium ${
              audioEnabled
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
            }`}
            title={audioEnabled ? 'Mute' : 'Unmute'}
          >
            {audioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all duration-200 font-medium ${
              videoEnabled
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
            }`}
            title={videoEnabled ? 'Stop video' : 'Start video'}
          >
            {videoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={endCall}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200 shadow-lg font-medium"
            title="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
