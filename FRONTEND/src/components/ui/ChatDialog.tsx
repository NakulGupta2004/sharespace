import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { showToast } from '../../utils/toast';
import api from '../../utils/api';
import { Video } from 'lucide-react';

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: string;
}

interface ChatDialogProps {
  user: User;
  onClose: () => void;
  onStartVideoCall?: (userId: string, userName: string) => void;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({ user: chatUser, onClose, onStartVideoCall }) => {
  const { user } = useAuth();
  const { sendMessage, socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch conversation history
    if (!chatUser?._id) return;
    api.get(`/api/messages/conversation/${chatUser._id}/general`)
      .then(res => setMessages(res.data.data || []))
      .catch(err => {
        console.error('Message error:', err);
        setMessages([]);
      });
  }, [chatUser]);

  useEffect(() => {
    // Listen for new messages
    if (!socket) return;
    const handleNewMessage = (data: any) => {
      if (data.senderId === chatUser._id || data.receiverId === chatUser._id) {
        setMessages(prev => [...prev, data.message || data]);
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, chatUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!chatUser?._id || !input.trim()) {
      showToast.warning('Please select a contact and enter a message.');
      return;
    }
    sendMessage(chatUser._id, 'general', input);
    const senderId = String(user?._id || user?.id || '');
    const receiverId = String(chatUser._id || chatUser.id || '');
    setMessages(prev => [...prev, {
      senderId,
      receiverId,
      content: input,
      createdAt: new Date().toISOString()
    }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-96 w-full">
      <div className="flex items-center mb-2 justify-between">
        <div className="flex items-center">
          <img src={chatUser.avatar_url && chatUser.avatar_url.trim() !== '' ? chatUser.avatar_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(chatUser.name || 'User')}&background=random`} alt={chatUser.name || 'User'} className="h-8 w-8 rounded-full mr-2" />
          <div className="font-bold text-gray-900">{chatUser.name}</div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (onStartVideoCall && chatUser._id) {
                onStartVideoCall(chatUser._id, chatUser.name);
                onClose();
              }
            }}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200"
            title="Start video call"
          >
            <Video className="h-5 w-5" />
          </button>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded p-2 mb-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 flex ${msg.senderId === String(user?._id || user?.id || '') ? 'justify-end' : 'justify-start'}`}> 
            <div className={`px-3 py-2 rounded-lg text-sm max-w-xs ${msg.senderId === String(user?._id || user?.id || '') ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
              {msg.content}
              <div className="text-xs text-gray-400 mt-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <Button variant="default" className="ml-2" onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
};
