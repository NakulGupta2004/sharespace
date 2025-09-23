import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  User,
  Moon,
  Sun,
  Menu,
  X,
  ShoppingCart,
  Plus,
  Users,
  MessageCircle
} from 'lucide-react';
import { ChatBox } from '../ui/ChatBox';
import { ChatDialog } from '../ui/ChatDialog';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null as null | any);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

                <button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </button>
      {/* ChatBox Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setIsChatOpen(false);
                  setSelectedChatUser(null);
                }}
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold mb-4">Chat</h2>
              {!selectedChatUser ? (
                <ChatBox
                  onSelectUser={u => setSelectedChatUser(u)}
                  onClose={() => setIsChatOpen(false)}
                />
              ) : (
                <ChatDialog
                  user={selectedChatUser}
                  onClose={() => setSelectedChatUser(null)}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                          >
                            Profile
                          </Link>
                          <Link
                            to="/settings"
                            className="block rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
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