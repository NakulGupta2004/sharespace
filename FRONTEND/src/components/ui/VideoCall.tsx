import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface VideoCallProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
  isTeamCall: boolean;
}

interface Participant {
  userId: string;
  userName: string;
  stream?: MediaStream;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  teamId,
  teamName,
  onClose,
  isTeamCall
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callActive, setCallActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const callIdRef = useRef(`${teamId}-${user?.id}-${Date.now()}`);

  // Define handlers first (before useEffect)
  const handleUserJoined = (data: {
    userId: string;
    userName: string;
    callId: string;
  }) => {
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
    createPeerConnection(data.userId, true);
  };

  const handleUserLeft = (data: { userId: string }) => {
    setParticipants(prev => prev.filter(p => p.userId !== data.userId));

    // Close peer connection
    if (peerConnectionsRef.current[data.userId]) {
      peerConnectionsRef.current[data.userId].close();
      delete peerConnectionsRef.current[data.userId];
    }
  };

  const createPeerConnection = async (peerId: string, initiator: boolean) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnectionsRef.current[peerId] = peerConnection;

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      setParticipants(prev =>
        prev.map(p =>
          p.userId === peerId ? { ...p, stream: event.streams[0] } : p
        )
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
          candidate: event.candidate,
          from: user?.id
        });
      }
    };

    if (initiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket?.emit('videoCall:offer', {
        to: peerId,
        offer,
        from: user?.id,
        fromName: user?.name
      });
    }
  };

  const handleOffer = async (data: {
    offer: RTCSessionDescriptionInit;
    from: string;
    fromName: string;
  }) => {
    if (!peerConnectionsRef.current[data.from]) {
      createPeerConnection(data.from, false);
    }

    const peerConnection = peerConnectionsRef.current[data.from];
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket?.emit('videoCall:answer', {
      to: data.from,
      answer,
      from: user?.id
    });
  };

  const handleAnswer = async (data: {
    answer: RTCSessionDescriptionInit;
    from: string;
  }) => {
    const peerConnection = peerConnectionsRef.current[data.from];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  };

  const handleIceCandidate = async (data: {
    candidate: RTCIceCandidateInit;
    from: string;
  }) => {
    const peerConnection = peerConnectionsRef.current[data.from];
    if (peerConnection && data.candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  };

  // Initialize local stream
  useEffect(() => {
    const initializeStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Notify others that this user is joining
        socket?.emit('videoCall:join', {
          teamId,
          userId: user?.id,
          userName: user?.name,
          callId: callIdRef.current,
          isTeamCall
        });
      } catch (err) {
        setError('Unable to access camera/microphone. Please check permissions.');
        console.error('Error accessing media devices:', err);
      }
    };

    initializeStream();

    return () => {
      // Cleanup on unmount
      localStream?.getTracks().forEach(track => track.stop());
      
      // Close all peer connections
      Object.values(peerConnectionsRef.current).forEach((peerConnection: any) => {
        if (peerConnection) {
          peerConnection.getSenders().forEach((sender: any) => {
            if (sender.track) sender.track.stop();
          });
          peerConnection.close();
        }
      });
      
      // Clear refs
      peerConnectionsRef.current = {};
      remoteVideoRefs.current = {};
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [teamId, user, socket, isTeamCall]);

  // Register socket listeners (after handlers are defined)
  useEffect(() => {
    socket?.on('videoCall:user-joined', handleUserJoined);
    socket?.on('videoCall:user-left', handleUserLeft);
    socket?.on('videoCall:offer', handleOffer);
    socket?.on('videoCall:answer', handleAnswer);
    socket?.on('videoCall:ice-candidate', handleIceCandidate);

    return () => {
      socket?.off('videoCall:user-joined', handleUserJoined);
      socket?.off('videoCall:user-left', handleUserLeft);
      socket?.off('videoCall:offer', handleOffer);
      socket?.off('videoCall:answer', handleAnswer);
      socket?.off('videoCall:ice-candidate', handleIceCandidate);
    };
  }, [socket, handleUserJoined, handleUserLeft, handleOffer, handleAnswer, handleIceCandidate]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);

      socket?.emit('videoCall:toggle-audio', {
        teamId,
        userId: user?.id,
        enabled: !audioEnabled
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);

      socket?.emit('videoCall:toggle-video', {
        teamId,
        userId: user?.id,
        enabled: !videoEnabled
      });
    }
  };

  const endCall = () => {
    setCallActive(false);

    // Close all peer connections and stop their tracks
    Object.values(peerConnectionsRef.current).forEach(pc => {
      pc.getSenders().forEach(sender => {
        sender.track?.stop();
      });
      pc.close();
    });
    peerConnectionsRef.current = {};

    // Stop local stream and all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    // Clear video ref
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    // Clear all remote video refs
    Object.keys(remoteVideoRefs.current).forEach(key => {
      if (remoteVideoRefs.current[key]) {
        remoteVideoRefs.current[key].srcObject = null;
      }
    });

    // Notify others
    socket?.emit('videoCall:leave', {
      teamId,
      userId: user?.id
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
              <h2 className="text-xl font-bold">{teamName}</h2>
              <p className="text-sm text-gray-400">
                {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
              </p>
            </div>
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

          {/* Video Grid */}
          <div className="flex-1 overflow-auto bg-gray-900 p-4">
            <div className={`grid gap-4 ${
              participants.length === 0
                ? 'grid-cols-1'
                : participants.length <= 2
                ? 'grid-cols-2'
                : participants.length <= 4
                ? 'grid-cols-2'
                : 'grid-cols-3'
            }`}>
              {/* Local Video */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-2xl overflow-hidden relative aspect-video"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-lg text-white text-sm">
                  {user?.name} (You)
                </div>
                {!videoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="h-12 w-12 text-gray-400" />
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
                  className="bg-gray-800 rounded-2xl overflow-hidden relative aspect-video"
                >
                  <video
                    ref={el => {
                      if (el) remoteVideoRefs.current[participant.userId] = el;
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-lg text-white text-sm">
                    {participant.userName}
                  </div>
                  {!participant.videoEnabled && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <VideoOff className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
