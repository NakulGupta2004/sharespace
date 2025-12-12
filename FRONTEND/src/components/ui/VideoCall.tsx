import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface VideoCallProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
}

interface RemoteUser {
  userId: string;
  userName: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ teamId, teamName, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // State
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Refs for video elements and peer connections
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const videoRefs = useRef<{ [userId: string]: HTMLVideoElement | null }>({});
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper to create peer connection
  const createPeerConnection = (remoteUserId: string) => {
    console.log(`[${user?.id}] Creating peer connection with ${remoteUserId}`);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
      ],
    });

    // Add all local tracks
    if (localStreamRef.current) {
      console.log(`[${user?.id}] Adding local tracks to connection with ${remoteUserId}`);
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log(`[${user?.id}] 🎥 Received remote track from ${remoteUserId}`, event.track.kind);

      if (event.streams && event.streams.length > 0) {
        const remoteStream = event.streams[0];
        const videoEl = videoRefs.current[remoteUserId];

        if (videoEl) {
          console.log(`[${user?.id}] Setting video element for ${remoteUserId}`);
          videoEl.srcObject = remoteStream;
          videoEl.play().catch(e => console.error(`Error playing video for ${remoteUserId}:`, e));
        } else {
          console.warn(`[${user?.id}] Video element not found for ${remoteUserId}`);
        }
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('call:ice-candidate', {
          to: remoteUserId,
          candidate: event.candidate,
          from: user?.id,
        });
      }
    };

    // Connection state logging
    pc.onconnectionstatechange = () => {
      console.log(`[${user?.id}] Connection state with ${remoteUserId}: ${pc.connectionState}`);
    };

    peerConnections.current[remoteUserId] = pc;
    return pc;
  };

  // Create and send offer
  const sendOffer = async (remoteUserId: string) => {
    try {
      console.log(`[${user?.id}] Creating offer for ${remoteUserId}`);

      let pc = peerConnections.current[remoteUserId];
      if (!pc) {
        pc = createPeerConnection(remoteUserId);
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await pc.setLocalDescription(offer);

      socket?.emit('call:offer', {
        to: remoteUserId,
        offer,
        from: user?.id,
        fromName: user?.name,
      });

      console.log(`[${user?.id}] Offer sent to ${remoteUserId}`);
    } catch (err) {
      console.error(`Error creating offer to ${remoteUserId}:`, err);
    }
  };

  // Initialize local media and join call
  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        console.log(`[${user?.id}] Initializing call...`);

        // Get local media
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: { echoCancellation: true, noiseSuppression: true },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        }

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join the call
        socket?.emit('call:join', {
          teamId,
          userId: user?.id,
          userName: user?.name,
        });

        // Send invite to all team members
        socket?.emit('call:invite', {
          teamId,
          from: user?.id,
          fromName: user?.name,
        });

        console.log(`[${user?.id}] Call initialized`);
      } catch (err) {
        console.error('Setup error:', err);
        if (isMounted) {
          setError(
            `Failed to access camera/mic: ${
              err instanceof DOMException ? err.message : 'Unknown error'
            }`
          );
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      localStream?.getTracks().forEach(t => {
        t.stop();
      });
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    console.log(`[${user?.id}] Setting up socket listeners`);

    // User joined - we should create an offer to them
    socket.on('call:user-joined', (data: { userId: string; userName: string }) => {
      console.log(`[${user?.id}] User joined: ${data.userName} (${data.userId})`);

      if (data.userId === user?.id) return;

      // First, add to remote users list
      setRemoteUsers(prev => {
        if (prev.some(u => u.userId === data.userId)) return prev;
        return [...prev, {
          userId: data.userId,
          userName: data.userName,
          videoEnabled: true,
          audioEnabled: true,
        }];
      });

      // Create offer immediately (don't wait)
      if (localStreamRef.current) {
        console.log(`[${user?.id}] Immediately creating offer for ${data.userId}`);
        sendOffer(data.userId).catch(err => console.error('Failed to send offer:', err));
      }
    });

    // Receive offer from another user
    socket.on('call:offer', async (data: { offer: RTCSessionDescriptionInit; from: string; fromName: string }) => {
      try {
        console.log(`[${user?.id}] Received offer from ${data.fromName} (${data.from})`);

        // Add to remote users if not already there
        setRemoteUsers(prev => {
          if (prev.some(u => u.userId === data.from)) return prev;
          return [...prev, {
            userId: data.from,
            userName: data.fromName,
            videoEnabled: true,
            audioEnabled: true,
          }];
        });

        let pc = peerConnections.current[data.from];
        if (!pc) {
          pc = createPeerConnection(data.from);
        }

        if (!pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

          const answer = await pc.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });

          await pc.setLocalDescription(answer);

          socket.emit('call:answer', {
            to: data.from,
            answer,
            from: user?.id,
          });

          console.log(`[${user?.id}] Answer sent to ${data.from}`);
        }
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // Receive answer
    socket.on('call:answer', async (data: { answer: RTCSessionDescriptionInit; from: string }) => {
      try {
        console.log(`[${user?.id}] Received answer from ${data.from}`);

        const pc = peerConnections.current[data.from];
        if (pc && !pc.remoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log(`[${user?.id}] Answer applied from ${data.from}`);
        }
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    // Receive ICE candidate
    socket.on('call:ice-candidate', async (data: { candidate: RTCIceCandidate; from: string }) => {
      try {
        const pc = peerConnections.current[data.from];
        if (pc && data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    // User left
    socket.on('call:user-left', (data: { userId: string }) => {
      console.log(`[${user?.id}] User left: ${data.userId}`);

      setRemoteUsers(prev => prev.filter(u => u.userId !== data.userId));

      const pc = peerConnections.current[data.userId];
      if (pc) {
        pc.close();
        delete peerConnections.current[data.userId];
      }

      if (videoRefs.current[data.userId]) {
        videoRefs.current[data.userId] = null;
      }
    });

    // Audio toggled
    socket.on('call:audio-toggled', (data: { userId: string; enabled: boolean }) => {
      setRemoteUsers(prev =>
        prev.map(u => (u.userId === data.userId ? { ...u, audioEnabled: data.enabled } : u))
      );
    });

    // Video toggled
    socket.on('call:video-toggled', (data: { userId: string; enabled: boolean }) => {
      setRemoteUsers(prev =>
        prev.map(u => (u.userId === data.userId ? { ...u, videoEnabled: data.enabled } : u))
      );
    });

    // Chat message
    socket.on('call:chat', (data: { userId: string; userName: string; message: string }) => {
      setChatMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off('call:user-joined');
      socket.off('call:offer');
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:user-left');
      socket.off('call:audio-toggled');
      socket.off('call:video-toggled');
      socket.off('call:chat');
    };
  }, [socket, user?.id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleToggleAudio = () => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !audioEnabled;
    });

    setAudioEnabled(!audioEnabled);

    socket?.emit('call:audio-toggled', {
      teamId,
      userId: user?.id,
      enabled: !audioEnabled,
    });
  };

  const handleToggleVideo = () => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getVideoTracks().forEach(track => {
      track.enabled = !videoEnabled;
    });

    setVideoEnabled(!videoEnabled);

    socket?.emit('call:video-toggled', {
      teamId,
      userId: user?.id,
      enabled: !videoEnabled,
    });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    socket?.emit('call:chat', {
      teamId,
      userId: user?.id,
      userName: user?.name,
      message: chatInput,
    });

    setChatMessages(prev => [
      ...prev,
      {
        userId: user?.id || '',
        userName: user?.name || 'You',
        message: chatInput,
      },
    ]);

    setChatInput('');
  };

  const handleEndCall = () => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach(track => {
      track.stop();
    });

    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => {
      pc.close();
    });

    peerConnections.current = {};
    videoRefs.current = {};

    // Notify server
    socket?.emit('call:leave', {
      teamId,
      userId: user?.id,
    });

    onClose();
  };

  if (error) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <motion.div className="bg-gray-900 p-8 rounded-lg border border-red-600 max-w-md">
            <h2 className="text-white font-bold text-lg mb-4">Error</h2>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-950 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{teamName} - Video Call</h2>
            <p className="text-sm text-gray-400">{remoteUsers.length + 1} participants</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Video Grid */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max overflow-auto">
              {/* Local Video */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-2xl overflow-hidden relative aspect-video shadow-lg border border-gray-700"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg text-white text-sm font-medium">
                  👤 {user?.name} (You)
                </div>
                {!videoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="h-16 w-16 text-gray-500" />
                  </div>
                )}
              </motion.div>

              {/* Remote Videos */}
              {remoteUsers.map(remoteUser => (
                <motion.div
                  key={remoteUser.userId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-800 rounded-2xl overflow-hidden relative aspect-video shadow-lg border border-gray-700"
                >
                  <video
                    ref={el => {
                      if (el) videoRefs.current[remoteUser.userId] = el;
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg text-white text-sm font-medium">
                    👤 {remoteUser.userName}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    {!remoteUser.audioEnabled && (
                      <div className="bg-red-600 p-1.5 rounded-full">
                        <MicOff className="h-4 w-4 text-white" />
                      </div>
                    )}
                    {!remoteUser.videoEnabled && (
                      <div className="bg-red-600 p-1.5 rounded-full">
                        <VideoOff className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  {!remoteUser.videoEnabled && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
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
                className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col"
              >
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 border-b border-gray-700">
                  <h3 className="text-white font-semibold flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-blue-400" />
                    Team Chat
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm">No messages yet</p>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            msg.userId === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <p className="font-semibold text-xs mb-1">
                            {msg.userId === user?.id ? 'You' : msg.userName}
                          </p>
                          <p>{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendChat()}
                      placeholder="Message..."
                      className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={handleSendChat}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-t border-gray-700 flex items-center justify-center gap-4 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleAudio}
            className={`p-3 rounded-full transition-all ${
              audioEnabled
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white`}
            title={audioEnabled ? 'Mute' : 'Unmute'}
          >
            {audioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleVideo}
            className={`p-3 rounded-full transition-all ${
              videoEnabled
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white`}
            title={videoEnabled ? 'Stop video' : 'Start video'}
          >
            {videoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full transition-all ${
              showChat
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
            title={showChat ? 'Hide chat' : 'Show chat'}
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEndCall}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all"
            title="End call"
          >
            <PhoneOff className="h-6 w-6" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
