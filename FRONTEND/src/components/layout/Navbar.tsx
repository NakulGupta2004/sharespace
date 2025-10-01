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
  MessageCircle
} from 'lucide-react';
// import { ChatBox } from '../ui/ChatBox'; // Unused
import { ChatDialog } from '../ui/ChatDialog';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

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
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

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
    if (!socket || !user) return;
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
    socket.on('new_booking_request', handleNewBooking);
    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_booking_request', handleNewBooking);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, user]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-gray-200/20 bg-white/80 backdrop-blur-lg dark:bg-gray-900/80 dark:border-gray-700/20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Workspace Toggle Switch */}
          <div className="hidden md:flex items-center mr-8">
            <span className={`mr-4 font-semibold transition-colors duration-300 ${workspace === 'marketplace' ? 'text-blue-600' : 'text-gray-400'}`}>Marketplace</span>
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
            <span className={`ml-4 font-semibold transition-colors duration-300 ${workspace === 'team' ? 'text-blue-600' : 'text-gray-400'}`}>Team Workspace</span>
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
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
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
          <div className="hidden md:flex items-center space-x-4">
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
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
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
                                <div className="font-medium text-blue-600">{n.type === 'booking' ? 'Booking' : 'Message'}</div>
                                <div className="text-gray-800 dark:text-gray-200">
                                  {n.type === 'message' && n.message && typeof n.message === 'object'
                                    ? `${n.message.senderId?.name || 'User'}: ${n.message.content}`
                                    : (typeof n.message === 'string' ? n.message : JSON.stringify(n.message))}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          className="mt-4 w-full bg-blue-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-600"
                          onClick={() => { setNotifications([]); setShowNotifications(false); }}
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
                        className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
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

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
            >
              <div className="space-y-1 pb-3 pt-2">
                {/* Mobile search */}
                <div className="px-3 pb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      className="w-full rounded-lg border border-gray-200 bg-white/50 py-2 pl-10 pr-4 text-sm backdrop-blur-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/50"
                    />
                  </div>
                </div>

                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/create-listing"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      List Item
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      className="block rounded-lg px-3 py-2 text-base font-medium text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-800"
                    >
                      Join Campus
                    </Link>
                  </>
                )}

                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {theme === 'light' ? <Moon className="mr-2 h-5 w-5" /> : <Sun className="mr-2 h-5 w-5" />}
                  {theme === 'light' ? 'Dark mode' : 'Light mode'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}