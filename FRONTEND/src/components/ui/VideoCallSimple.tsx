import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface VideoCallSimpleProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
}

interface RemoteUser {
  userId: string;
  userName: string;
  stream: MediaStream | null;
}

export const VideoCallSimple: React.FC<VideoCallSimpleProps> = ({
  teamId,
  teamName,
  onClose
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [userId: string]: HTMLVideoElement | null }>({});
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const callId = useRef(`call-${teamId}-${user?.id}-${Date.now()}`);

  // Initialize local stream and join call
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join the call
        socket?.emit('call:join', {
          teamId,
          userId: user?.id,
          userName: user?.name,
          callId: callId.current
        });
      } catch (err) {
        setError(
          `Failed to access camera/mic: ${err instanceof DOMException ? err.message : 'Unknown error'}`
        );
      }
    };

    initialize();

    return () => {
      localStream?.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
    };
  }, []);

  // Handle user joined
  useEffect(() => {
    const handleUserJoined = (data: {
      userId: string;
      userName: string;
    }) => {
      if (data.userId === user?.id) return;

      console.log(`User joined: ${data.userName}`);

      setRemoteUsers(prev => {
        if (prev.some(u => u.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, userName: data.userName, stream: null }];
      });

      // Create offer for new user
      if (localStream) {
        createOffer(data.userId);
      }
    };

    socket?.on('call:user-joined', handleUserJoined);

    return () => {
      socket?.off('call:user-joined', handleUserJoined);
    };
  }, [localStream, user?.id, socket]);

  // Handle offer
  useEffect(() => {
    const handleOffer = async (data: {
      from: string;
      fromName: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      console.log(`Got offer from ${data.fromName}`);

      if (!peerConnections.current[data.from]) {
        await createPeerConnection(data.from);
      }

      const pc = peerConnections.current[data.from];

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket?.emit('call:answer', {
          to: data.from,
          answer,
          from: user?.id
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    socket?.on('call:offer', handleOffer);

    return () => {
      socket?.off('call:offer', handleOffer);
    };
  }, [user?.id, socket]);

  // Handle answer
  useEffect(() => {
    const handleAnswer = async (data: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log(`Got answer from ${data.from}`);

      const pc = peerConnections.current[data.from];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    };

    socket?.on('call:answer', handleAnswer);

    return () => {
      socket?.off('call:answer', handleAnswer);
    };
  }, [socket]);

  // Handle ICE candidate
  useEffect(() => {
    const handleIceCandidate = async (data: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnections.current[data.from];
      if (pc && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    socket?.on('call:ice-candidate', handleIceCandidate);

    return () => {
      socket?.off('call:ice-candidate', handleIceCandidate);
    };
  }, [socket]);

  // Handle user left
  useEffect(() => {
    const handleUserLeft = (data: { userId: string }) => {
      console.log(`User left: ${data.userId}`);

      const pc = peerConnections.current[data.userId];
      if (pc) {
        pc.close();
        delete peerConnections.current[data.userId];
      }

      setRemoteUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    socket?.on('call:user-left', handleUserLeft);

    return () => {
      socket?.off('call:user-left', handleUserLeft);
    };
  }, [socket]);

  // Create peer connection
  const createPeerConnection = async (userId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log(`Received track from ${userId}:`, event.track.kind);

      setRemoteUsers(prev =>
        prev.map(u =>
          u.userId === userId
            ? { ...u, stream: event.streams[0] }
            : u
        )
      );

      const videoEl = remoteVideoRefs.current[userId];
      if (videoEl) {
        videoEl.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('call:ice-candidate', {
          to: userId,
          candidate: event.candidate,
          from: user?.id
        });
      }
    };

    peerConnections.current[userId] = pc;
  };

  // Create offer
  const createOffer = async (userId: string) => {
    try {
      await createPeerConnection(userId);
      const pc = peerConnections.current[userId];

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit('call:offer', {
        to: userId,
        offer,
        from: user?.id,
        fromName: user?.name
      });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !audioOn;
      });
      setAudioOn(!audioOn);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoOn;
      });
      setVideoOn(!videoOn);
    }
  };

  // End call
  const handleEndCall = () => {
    // Close all connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    // Stop local stream
    localStream?.getTracks().forEach(track => {
      track.enabled = false;
      track.stop();
    });

    // Notify others
    socket?.emit('call:leave', {
      teamId,
      userId: user?.id
    });

    onClose();
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
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 flex justify-between items-center border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-cyan-400">{teamName}</h2>
            <p className="text-sm text-gray-400">
              🎥 {remoteUsers.length + 1} participant{remoteUsers.length !== 0 ? 's' : ''}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndCall}
            className="p-2 hover:bg-red-600 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 m-4 rounded">
            {error}
          </div>
        )}

        {/* Video Grid */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-900 to-gray-950 p-4">
          <div className={`grid gap-4 h-full content-start ${
            remoteUsers.length === 0
              ? 'grid-cols-1'
              : remoteUsers.length === 1
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-2'
          }`}>
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
                📹 {user?.name} (You)
              </div>
              {!videoOn && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
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
                    if (el) remoteVideoRefs.current[remoteUser.userId] = el;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1.5 rounded-lg text-white text-sm font-medium">
                  👤 {remoteUser.userName}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex justify-center items-center space-x-4 border-t border-gray-700">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-all ${
              audioOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            {audioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all ${
              videoOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
            } text-white`}
          >
            {videoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEndCall}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all"
          >
            <PhoneOff className="h-6 w-6" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
