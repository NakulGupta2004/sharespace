import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  sendMessage: (receiverId: string, listingId: string, content: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  sendMessage: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('sharespace_token');
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (receiverId: string, listingId: string, content: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('send_message', { receiverId, listingId, content });
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};
