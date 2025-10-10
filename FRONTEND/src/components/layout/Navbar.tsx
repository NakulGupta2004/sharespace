import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  ShoppingCart,
  Plus,
  Users,
  MessageCircle,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';
// import { ChatBox } from '../ui/ChatBox'; // Unused
import { ChatDialog } from '../ui/ChatDialog';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

export default function Navbar({ workspace, setWorkspace }: { workspace: 'marketplace' | 'team', setWorkspace: (w: 'marketplace' | 'team') => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null as null | any);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  // Use a more specific type for contacts if possible
  type Contact = { _id: string; name: string; email: string; avatar_url?: string };
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  // Update notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/teams/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      if (response.data.success) {
        const notifs = response.data.notifications.map((n: any) => ({
          type: n.type,
          message: n.message,
          time: new Date(n.createdAt).toLocaleDateString(),
          ...n.data,
          id: n._id,
          isRead: n.isRead
        }));
        setNotifications(notifs);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (!isChatOpen) return;
    setLoading(true);
    api.get('/api/users/contacts', {
      headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
    })
      .then(res => {
        setContacts(res.data.contacts || []);
      })
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, [isChatOpen]);

  const filteredContacts = contacts.filter(u =>
    u._id !== user?._id &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );
  // Listen for socket notifications
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⚠️ Socket not available or not connected in Navbar', { socket: !!socket, isConnected });
      return;
    }
    console.log('🔌 Socket connected in Navbar, setting up listeners');
    const handleNewBooking = (data: any) => {
      setNotifications(prev => [{
        type: 'booking',
        message: `New booking request for your item: ${data.listingTitle || 'Item'}`,
        time: new Date().toLocaleTimeString(),
        ...data
      }, ...prev]);
    };
    const handleNewMessage = (data: any) => {
      setNotifications(prev => [{
        type: 'message',
        message: `New message from ${data.message?.senderId?.name || 'User'}: ${data.message?.content}`,
        time: new Date().toLocaleTimeString(),
        ...data
      }, ...prev]);
    };
    const handleInviteAccepted = (data: any) => {
      console.log('🔄 Invite accepted event received in Navbar:', data);
      // Refresh notifications to reflect the change
      fetchNotifications();
      // Also refresh user data to update pending invites
      if (refreshUser) {
        refreshUser();
      }
      // Join the team room if socket is available
      if (socket && data.teamId) {
        console.log('Joining team room after accepting invite:', data.teamId);
        socket.emit('join_team', data.teamId);
      }
    };
    const handleInviteRejected = (data: any) => {
      console.log('Invite rejected event:', data);
      // Refresh notifications to reflect the change
      fetchNotifications();
    };

    socket.on('new_booking_request', handleNewBooking);
    socket.on('new_message', handleNewMessage);
    socket.on('invite_accepted', handleInviteAccepted);
    socket.on('invite_rejected', handleInviteRejected);

    return () => {
      socket.off('new_booking_request', handleNewBooking);
      socket.off('new_message', handleNewMessage);
      socket.off('invite_accepted', handleInviteAccepted);
      socket.off('invite_rejected', handleInviteRejected);
    };
  }, [socket, isConnected, user]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const handleAcceptInvite = async (teamId: string, notificationId: string) => {
    try {
      await api.post(`/api/teams/accept-invite/${teamId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      toast.success('Team invite accepted!');
      // Mark notification as read
      await api.post('/api/teams/notifications/mark-read', { notificationIds: [notificationId] }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      // Refresh notifications immediately
      fetchNotifications();
      // Fallback refresh in case socket event doesn't work
      setTimeout(() => fetchNotifications(), 1000);
    } catch (error) {
      toast.error('Failed to accept invite');
    }
  };

  const handleRejectInvite = async (teamId: string, notificationId: string) => {
    try {
      await api.post(`/api/teams/reject-invite/${teamId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      toast.success('Team invite rejected');
      // Mark notification as read
      await api.post('/api/teams/notifications/mark-read', { notificationIds: [notificationId] }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      // Refresh notifications immediately
      fetchNotifications();
      // Fallback refresh in case socket event doesn't work
      setTimeout(() => fetchNotifications(), 1000);
    } catch (error) {
      toast.error('Failed to reject invite');
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-gray-200/20 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80 dark:border-gray-700/20"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <div className="flex h-12 sm:h-16 items-center justify-between">
          {/* Mobile: Compact Logo + Hamburger */}
          <div className="flex md:hidden items-center space-x-16 flex-1">
            {/* Mobile Logo - Smaller */}
            <Link to="/" className="flex items-center space-x-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-r from-blue-500 to-green-500">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                ShareSpace
              </span>
            </Link>

            {/* Mobile Workspace Toggle - Compact */}
            <div className="flex items-center ml-auto mr-2">
              <button
                className={`w-8 h-4 flex items-center bg-gray-300 rounded-full p-0.5 transition-colors duration-300 focus:outline-none ${workspace === 'team' ? 'bg-blue-600' : 'bg-gray-300'}`}
                onClick={() => setWorkspace(workspace === 'marketplace' ? 'team' : 'marketplace')}
                aria-label="Toggle workspace"
              >
                <span
                  className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform duration-300 ${workspace === 'team' ? 'translate-x-4' : ''}`}
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                />
              </button>
            </div>

            {/* Mobile Menu Button and Profile */}
            <div className="flex items-center space-x-2">
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 rounded-full bg-gray-100 p-1 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                      alt={user.name}
                      className="h-7 w-7 rounded-full"
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10 z-50"
                      >
                        <div className="p-2">
                          <div className="px-3 py-2 text-sm">
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                          <hr className="my-2 border-gray-200 dark:border-gray-700" />
                          <Link
                            to="/profile"
                            className="block rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Profile
                          </Link>
                          <Link
                            to="/settings"
                            className="block rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Settings
                          </Link>
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsProfileOpen(false);
                            }}
                            className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                          >
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between w-full">
            {/* Workspace Toggle Switch */}
            <div className="flex items-center mr-8">
              <span className={`mr-4 text-base font-semibold transition-colors duration-300 ${workspace === 'marketplace' ? 'text-blue-600' : 'text-gray-400'}`}>Marketplace</span>
              <button
                className={`w-16 h-8 flex items-center bg-gray-300 rounded-full p-1 transition-colors duration-300 focus:outline-none ${workspace === 'team' ? 'bg-blue-600' : 'bg-gray-300'}`}
                onClick={() => setWorkspace(workspace === 'marketplace' ? 'team' : 'marketplace')}
                aria-label="Toggle workspace"
              >
                <span
                  className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300 ${workspace === 'team' ? 'translate-x-8' : ''}`}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                />
              </button>
              <span className={`ml-4 text-base font-semibold transition-colors duration-300 ${workspace === 'team' ? 'text-blue-600' : 'text-gray-400'}`}>Team</span>
            </div>

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-green-500">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  ShareSpace
                </span>
              </motion.div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find items, books, or kits..."
                  className="w-full rounded-lg border border-gray-200 bg-white/50 py-2 pl-10 pr-4 text-sm backdrop-blur-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <Users className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <Link
                  to="/create-listing"
                  className="flex items-center space-x-1 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-blue-600 hover:to-green-600 hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                  <span>List Item</span>
                </Link>


                {/* Message Icon */}
                <button
                  type="button"
                  className="relative p-2 rounded-full hover:bg-blue-100 focus:outline-none"
                  aria-label="Open chat"
                  onClick={() => setIsChatOpen(true)}
                >
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </button>

                <div className="relative">
                  <button
                    className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="h-5 w-5" />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg z-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">Notifications</h3>
                        {notifications.length === 0 ? (
                          <div className="text-gray-500">No notifications</div>
                        ) : (
                          <ul className="space-y-2 max-h-64 overflow-y-auto">
                            {notifications.slice(0, 10).map((n, idx) => (
                              <li
                                key={idx}
                                className={`border-b pb-2 last:border-b-0 ${n.type === 'message' ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                                onClick={() => {
                                  if (n.type === 'message' && n.message && typeof n.message === 'object') {
                                    setSelectedChatUser({
                                      _id: n.message.senderId?._id || n.message.senderId?.id,
                                      name: n.message.senderId?.name,
                                      email: n.message.senderId?.email,
                                      avatar_url: n.message.senderId?.avatar_url
                                    });
                                    setIsChatOpen(true);
                                    setShowNotifications(false);
                                  }
                                }}
                              >
                                <div className="font-medium text-blue-600">
                                  {n.type === 'booking' ? 'Booking' : n.type === 'team_invite' ? 'Team Invite' : 'Message'}
                                </div>
                                <div className="text-gray-800 dark:text-gray-200">
                                  {n.type === 'message' && n.message && typeof n.message === 'object'
                                    ? `${n.message.senderId?.name || 'User'}: ${n.message.content}`
                                    : (typeof n.message === 'string' ? n.message : JSON.stringify(n.message))}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                                {n.type === 'team_invite' && (
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                                      onClick={(e) => { e.stopPropagation(); handleAcceptInvite(n.teamId, n.id); }}
                                    >
                                      Accept
                                    </button>
                                    <button
                                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                      onClick={(e) => { e.stopPropagation(); handleRejectInvite(n.teamId, n.id); }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          className="mt-4 w-full bg-blue-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-600"
                          onClick={async () => {
                            try {
                              await api.post('/api/teams/notifications/mark-read', {}, {
                                headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
                              });
                              setNotifications([]);
                              setShowNotifications(false);
                            } catch (error) {
                              console.error('Failed to mark notifications as read:', error);
                            }
                          }}
                        >Clear Notifications</button>
                      </div>
                    </div>
                  )}
                </div>
      {/* Integrated ChatBox in Navbar */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm" style={{ marginTop: '5rem' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto p-0 relative flex flex-col border border-gray-200" style={{ minHeight: 500, maxHeight: '80vh', overflow: 'auto' }}>
            <button onClick={() => { setIsChatOpen(false); setSelectedChatUser(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"><span className="sr-only">Close</span>✕</button>
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
                      <li key={u._id} className={`flex items-center py-4 px-4 hover:bg-blue-100 cursor-pointer transition ${selectedChatUser?._id === u._id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedChatUser(u)}>
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
                {selectedChatUser ? (
                  <div className="w-full h-full flex flex-col justify-center items-center">
                    <ChatDialog user={selectedChatUser} onClose={() => setSelectedChatUser(null)} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 mb-4">
                      <path d="M21 15.5V6.5A2.5 2.5 0 0 0 18.5 4h-13A2.5 2.5 0 0 0 3 6.5v9A2.5 2.5 0 0 0 5.5 18H7v2.5a.5.5 0 0 0 .8.4l3.7-2.9h6A2.5 2.5 0 0 0 21 15.5Z" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="text-lg">Select a contact to start chatting</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 rounded-full bg-gray-100 p-1 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
                      >
                        <div className="p-2">
                          <div className="px-3 py-2 text-sm">
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                          <hr className="my-2 border-gray-200 dark:border-gray-700" />
                          <Link
                            to="/profile"
                            className="block rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Profile
                          </Link>
                          <Link
                            to="/settings"
                            className="block rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                          >
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-green-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-blue-600 hover:to-green-600 hover:scale-105"
                >
                  Join Campus
                </Link>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Hamburger Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-xl z-40"
            >
              <div className="px-4 py-6 space-y-4">
                {/* Mobile Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search items, books, or kits..."
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white dark:placeholder-gray-400 transition-all duration-200"
                  />
                </div>

                {/* Navigation Links */}
                <div className="space-y-2">
                  {user ? (
                    <>
                      {/* Authenticated User Menu */}
                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-3 rounded-xl px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/create-listing"
                        className="flex items-center space-x-3 rounded-xl px-4 py-3 text-base font-medium bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600 transition-all duration-200 shadow-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Plus className="h-5 w-5" />
                        <span>List Item</span>
                      </Link>

                      {/* Theme Toggle in Menu */}
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 w-full rounded-xl px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                      >
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                      </button>

                      {/* Sign Out */}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 w-full rounded-xl px-4 py-3 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Non-Authenticated User Menu */}
                      <Link
                        to="/login"
                        className="flex items-center space-x-3 rounded-xl px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>Sign In</span>
                      </Link>

                      <Link
                        to="/register"
                        className="flex items-center space-x-3 rounded-xl px-4 py-3 text-base font-medium bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600 transition-all duration-200 shadow-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <UserPlus className="h-5 w-5" />
                        <span>Join Campus</span>
                      </Link>

                      {/* Theme Toggle in Menu */}
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 w-full rounded-xl px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                      >
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </motion.nav>
  )
}