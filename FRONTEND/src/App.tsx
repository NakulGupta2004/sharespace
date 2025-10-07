import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useState } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import TeamWorkspacePage from './pages/TeamWorkspacePage';
import ListingPage from './pages/ListingPage';
import TeamPage from './pages/TeamPage';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

function App() {
  const [workspace, setWorkspace] = useState<'marketplace' | 'team'>('marketplace');
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
              <Navbar workspace={workspace} setWorkspace={setWorkspace} />
              <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex-1"
              >
                {workspace === 'marketplace' ? (
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/create-listing" element={<CreateListingPage />} />
                    <Route path="/listing/:id" element={<ListingDetailPage />} />
                    <Route path="/listings" element={<ListingPage />} />
                    <Route path="/team/:id" element={<TeamPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Routes>
                ) : (
                  <TeamWorkspacePage />
                )}
              </motion.main>
              <Footer />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    fontSize: '14px',
                    fontWeight: '500',
                  },
                  success: {
                    style: {
                      background: 'rgba(34, 197, 94, 0.95)',
                      color: 'white',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    },
                    icon: '✅',
                  },
                  error: {
                    style: {
                      background: 'rgba(239, 68, 68, 0.95)',
                      color: 'white',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    },
                    icon: '❌',
                  },
                  loading: {
                    style: {
                      background: 'rgba(59, 130, 246, 0.95)',
                      color: 'white',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;