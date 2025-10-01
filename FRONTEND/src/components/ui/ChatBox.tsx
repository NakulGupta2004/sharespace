
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { ChatDialog } from './ChatDialog';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export const ChatBox: React.FC<{ onClose: () => void; onSelectUser?: (user: User) => void }> = ({ onClose, onSelectUser }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/api/users/contacts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
    })
      .then(res => {
        setContacts(res.data.contacts || []);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredContacts = contacts.filter(u =>
    u._id !== user?._id &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50" style={{ marginTop: '5rem' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto p-0 relative flex flex-col border border-gray-200" style={{ minHeight: 500, maxHeight: '80vh', overflow: 'auto' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"><span className="sr-only">Close</span>✕</button>
        <div className="flex h-full" style={{ minHeight: 500 }}>
          {/* Contacts List */}
          <div className="w-1/3 border-r bg-gray-50 flex flex-col">
            <h2 className="text-xl font-bold p-4 text-blue-700 border-b">Contacts</h2>
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mx-4 my-2 rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading contacts...</div>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-y-auto flex-1">
                {filteredContacts.length === 0 && (
                  <li className="py-8 text-center text-gray-400">No contacts found</li>
                )}
                {filteredContacts.map(u => (
                  <li key={u._id} className={`flex items-center py-4 px-4 hover:bg-blue-100 cursor-pointer transition ${selectedUser?._id === u._id ? 'bg-blue-50' : ''}`} onClick={() => {
                    setSelectedUser(u);
                    if (onSelectUser) onSelectUser(u);
                  }}>
                    <img src={u.avatar_url && u.avatar_url.trim() !== '' ? u.avatar_url : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`} alt={u.name || 'User'} className="h-10 w-10 rounded-full mr-3 border border-gray-200" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Chat Area */}
          <div className="w-2/3 flex flex-col items-center justify-center">
            {selectedUser ? (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <ChatDialog user={selectedUser} onClose={() => setSelectedUser(null)} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageIcon className="w-16 h-16 mb-4" />
                <div className="text-lg">Select a contact to start chatting</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M21 15.5V6.5A2.5 2.5 0 0 0 18.5 4h-13A2.5 2.5 0 0 0 3 6.5v9A2.5 2.5 0 0 0 5.5 18H7v2.5a.5.5 0 0 0 .8.4l3.7-2.9h6A2.5 2.5 0 0 0 21 15.5Z" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
