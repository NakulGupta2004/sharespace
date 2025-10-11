import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Settings,
  Camera,
  Edit3,
  Save,
  X,
  Shield,
  CreditCard,
  BookOpen,
  Package,
  MessageSquare,
  TrendingUp,
  Eye,
  FileText,
  Heart,
  CheckCircle,
  Badge,
  Target,
  Activity,
  Bell,
  Lock,
  Globe,
  Crown,
  Zap,
  Trophy,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview')
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    college_id: user?.college_id || '',
    phone: '',
    bio: '',
    location: '',
    social_links: {
      linkedin: '',
      twitter: '',
      instagram: ''
    }
  })
  const [stats, setStats] = useState({
    totalListings: 12,
    activeListings: 8,
    totalViews: 342,
    totalBookings: 25,
    rating: 4.8,
    joinedDate: '2024-01-15'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }
  }, [user, authLoading, navigate])

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return

      try {
        setLoading(true)
        const token = localStorage.getItem('sharespace_token')

        if (!token) {
          console.error('No token found in localStorage')
          navigate('/login')
          return
        }

        console.log('Making API call with token:', token.substring(0, 20) + '...')

        // Fetch profile details
        const profileResponse = await api.get('/api/users/profile')

        const profileData = profileResponse.data
        if (profileData.success) {
          const userData = profileData.user
          setProfileData({
            name: userData.name || '',
            email: userData.email || '',
            college_id: userData.college_id || '',
            phone: userData.phone || '',
            bio: userData.bio || '',
            location: userData.location || '',
            social_links: userData.social_links || {
              linkedin: '',
              twitter: '',
              instagram: ''
            }
          })
        }

        // Mock stats for now - you can implement real stats later
        const mockStats = {
          totalListings: 12,
          activeListings: 8,
          totalViews: 342,
          totalBookings: 25,
          rating: 4.8,
          joinedDate: '2024-01-15'
        }
        setStats(mockStats)
        console.log('Stats loaded:', mockStats)
      } catch (error: any) {
        console.error('Error fetching profile data:', error)
        if (error.status === 401 || error.message?.includes('401')) {
          console.log('Authentication failed, redirecting to login')
          localStorage.removeItem('sharespace_token')
          navigate('/login')
          return
        }
        toast.error('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [user])

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const response = await api.put('/api/users/profile', {
        name: profileData.name,
        phone: profileData.phone,
        bio: profileData.bio,
        location: profileData.location,
        social_links: profileData.social_links
      })

      const data = response.data
      if (data.success) {
        setIsEditing(false)
        toast.success('Profile updated successfully!')
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      if (error.status === 401 || error.message?.includes('401')) {
        console.log('Authentication failed during save, redirecting to login')
        localStorage.removeItem('sharespace_token')
        navigate('/login')
        return
      }
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30"
        >
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Please Log In
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to view your profile
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 font-medium"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </motion.div>
      </div>
    )
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-300">Loading your profile...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-2xl"
        />
      </div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        {/* Enhanced Hero Header */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-8 shadow-2xl border border-white/20"
        >
          {/* Enhanced Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-bounce delay-500"></div>

          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
            />
          ))}

          <div className="relative z-10 flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Enhanced Avatar Section */}
            <div className="relative group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm"
              >
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=256&color=ffffff&bold=true`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=256&color=ffffff&bold=true`
                  }}
                />
                {/* Online Status Indicator */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 border-2 border-white rounded-full"
                />
              </motion.div>

              {/* Enhanced Avatar Upload Overlay */}
              <motion.div
                whileHover={{ opacity: 1, scale: 1.05 }}
                className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 transition-all duration-300 cursor-pointer group-hover:opacity-100"
              >
                <Camera className="h-8 w-8 text-white drop-shadow-lg" />
              </motion.div>
            </div>

            {/* Enhanced User Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-2">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl font-bold text-white drop-shadow-lg"
                >
                  {user.name}
                </motion.h1>
                {user.is_verified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="p-2 bg-green-500 rounded-full shadow-lg"
                  >
                    <CheckCircle className="h-6 w-6 text-white" />
                  </motion.div>
                )}
              </div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-indigo-100 text-lg mb-2 drop-shadow-md"
              >
                {user.email}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-indigo-200 text-sm mb-4 drop-shadow-sm"
              >
                ID: {user.college_id}
              </motion.p>

              {/* Enhanced Quick Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center lg:justify-start space-x-8 mb-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"
                >
                  <p className="text-2xl font-bold text-white">{stats.totalListings}</p>
                  <p className="text-indigo-100 text-sm">Items</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"
                >
                  <p className="text-2xl font-bold text-white">{stats.rating.toFixed(1)}</p>
                  <p className="text-indigo-100 text-sm">Rating</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"
                >
                  <p className="text-2xl font-bold text-white">{user.reputation.score}</p>
                  <p className="text-indigo-100 text-sm">Reputation</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"
                >
                  <p className="text-2xl font-bold text-white">{user.credits}</p>
                  <p className="text-indigo-100 text-sm">Credits</p>
                </motion.div>
              </motion.div>

              {/* Enhanced Achievement Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center lg:justify-start space-x-3"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center space-x-2 bg-yellow-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-400/30"
                >
                  <Crown className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-100 text-sm font-medium">Premium Member</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-400/30"
                >
                  <Zap className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-100 text-sm font-medium">Top Seller</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center space-x-2 bg-purple-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-400/30"
                >
                  <Trophy className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-100 text-sm font-medium">Trusted User</span>
                </motion.div>
              </motion.div>
            </div>

            {/* Enhanced Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col space-y-3"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/30 transition-all duration-300 flex items-center space-x-2 shadow-lg"
              >
                {isEditing ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2 shadow-lg"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Navigation Tabs */}
        <motion.div
          variants={itemVariants}
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-2 mb-8 shadow-xl border border-white/20"
        >
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Overview', icon: Target, color: 'from-blue-500 to-blue-600' },
              { id: 'activity', label: 'Activity', icon: Activity, color: 'from-green-500 to-green-600' },
              { id: 'settings', label: 'Settings', icon: Settings, color: 'from-purple-500 to-purple-600' }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Persistent Stats Grid - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Package}
              label="Total Listings"
              value={stats.totalListings}
              color="bg-gradient-to-r from-blue-500 to-blue-600"
              bgColor="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
              trend="+12%"
              description="Active marketplace items"
            />
            <StatCard
              icon={Eye}
              label="Profile Views"
              value={stats.totalViews}
              color="bg-gradient-to-r from-green-500 to-green-600"
              bgColor="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
              trend="+8%"
              description="People viewed your profile"
            />
            <StatCard
              icon={BookOpen}
              label="Bookings"
              value={stats.totalBookings}
              color="bg-gradient-to-r from-purple-500 to-purple-600"
              bgColor="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
              trend="+15%"
              description="Successful transactions"
            />
            <StatCard
              icon={Star}
              label="Rating"
              value={`${stats.rating.toFixed(1)}/5`}
              color="bg-gradient-to-r from-yellow-500 to-yellow-600"
              bgColor="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20"
              trend="+0.2"
              description="Average user rating"
            />
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Profile Details & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Information */}
                <motion.div
                  variants={itemVariants}
                  className="bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                      <User className="h-6 w-6 text-blue-500" />
                      <span>Profile Details</span>
                    </h3>
                    {isEditing && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded-xl transition-colors duration-300 flex items-center space-x-2 shadow-lg"
                      >
                        {saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>{saving ? 'Saving...' : 'Save'}</span>
                      </motion.button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
                      ) : (
                        <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700/30">
                          <User className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">{user.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700/30">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{user.email}</span>
                        <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                      </div>
                    </div>

                    {/* College ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        College ID
                      </label>
                      <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700/30">
                        <Badge className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{user.college_id}</span>
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="Enter your phone number"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
                      ) : (
                        <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700/30">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {profileData.phone || 'Not provided'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                          placeholder="Enter your location"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        />
                      ) : (
                        <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700/30">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {profileData.location || 'Not provided'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bio
                      </label>
                      {isEditing ? (
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                        />
                      ) : (
                        <div className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700/30">
                          <div className="flex items-start space-x-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                            <span className="text-gray-900 dark:text-white">
                              {profileData.bio || 'No bio provided'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Quick Actions & Account Info */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                      <Zap className="h-6 w-6 text-yellow-500" />
                      <span>Quick Actions</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/create-listing')}
                        className="flex flex-col items-center justify-center space-y-2 p-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl transition-all duration-300 shadow-lg"
                      >
                        <Package className="h-6 w-6" />
                        <span className="text-sm font-medium">New Listing</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/dashboard')}
                        className="flex flex-col items-center justify-center space-y-2 p-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl transition-all duration-300 shadow-lg"
                      >
                        <TrendingUp className="h-6 w-6" />
                        <span className="text-sm font-medium">Dashboard</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/messages')}
                        className="flex flex-col items-center justify-center space-y-2 p-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 shadow-lg"
                      >
                        <MessageSquare className="h-6 w-6" />
                        <span className="text-sm font-medium">Messages</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center justify-center space-y-2 p-4 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl transition-all duration-300 shadow-lg"
                      >
                        <Heart className="h-6 w-6" />
                        <span className="text-sm font-medium">Favorites</span>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Account Status */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-gray-900 dark:text-white">Email Verified</span>
                        </div>
                        <span className="text-green-500 text-sm font-medium">Active</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-blue-500" />
                          <span className="text-gray-900 dark:text-white">Security</span>
                        </div>
                        <span className="text-blue-500 text-sm font-medium">Secure</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-purple-500" />
                          <span className="text-gray-900 dark:text-white">Credits</span>
                        </div>
                        <span className="text-purple-500 text-sm font-medium">{user.credits}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-yellow-500" />
                          <span className="text-gray-900 dark:text-white">Member Since</span>
                        </div>
                        <span className="text-yellow-500 text-sm font-medium">
                          {new Date(stats.joinedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Activity Summary Stats */}
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                  <span>Activity Summary</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800"
                  >
                    <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalListings}</p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm">Total Listings</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl border border-green-200 dark:border-green-800"
                  >
                    <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">12</p>
                    <p className="text-green-600 dark:text-green-400 text-sm">Bookings Made</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl border border-purple-200 dark:border-purple-800"
                  >
                    <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">8</p>
                    <p className="text-purple-600 dark:text-purple-400 text-sm">Completed</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl border border-orange-200 dark:border-orange-800"
                  >
                    <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">94%</p>
                    <p className="text-orange-600 dark:text-orange-400 text-sm">Success Rate</p>
                  </motion.div>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                  <Activity className="h-6 w-6 text-green-500" />
                  <span>Recent Activity</span>
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      action: 'Listed new item',
                      item: 'MacBook Pro 2023',
                      time: '2 hours ago',
                      icon: Package,
                      color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
                      details: 'High-performance laptop for rent',
                      status: 'active'
                    },
                    {
                      action: 'Received booking',
                      item: 'Canon DSLR Camera',
                      time: '1 day ago',
                      icon: BookOpen,
                      color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
                      details: 'Booked by John Doe for 3 days',
                      status: 'completed'
                    },
                    {
                      action: 'Completed transaction',
                      item: 'Study Table',
                      time: '3 days ago',
                      icon: CheckCircle,
                      color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
                      details: 'Successfully rented to Jane Smith',
                      status: 'completed'
                    },
                    {
                      action: 'Updated profile',
                      item: 'Profile information',
                      time: '1 week ago',
                      icon: Edit3,
                      color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
                      details: 'Updated bio and contact information',
                      status: 'completed'
                    }
                  ].map((activity, index) => {
                    const Icon = activity.icon
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="flex items-center space-x-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <div className={`p-3 rounded-2xl ${activity.color} border border-current/20`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-gray-900 dark:text-white font-semibold">{activity.action}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              activity.status === 'active'
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{activity.item}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">{activity.details}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 dark:text-gray-400 text-sm block">{activity.time}</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-1"
                          >
                            View Details
                          </motion.button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/30"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h3>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Settings</h4>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">Show email publicly</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Allow others to see your email address</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/30">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">Email notifications</p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h4>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center space-x-2 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-colors duration-300"
                    >
                      <Lock className="h-5 w-5" />
                      <span>Change Password</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center space-x-2 p-4 bg-gray-500 hover:bg-gray-600 text-white rounded-2xl transition-colors duration-300"
                    >
                      <Globe className="h-5 w-5" />
                      <span>Privacy Settings</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center space-x-2 p-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-colors duration-300"
                    >
                      <Bell className="h-5 w-5" />
                      <span>Notification Preferences</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, color, bgColor, trend, description }: {
  icon: any
  label: string
  value: string | number
  color: string
  bgColor: string
  trend?: string
  description?: string
}) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -5 }}
    className={`${bgColor} rounded-3xl p-6 shadow-lg border border-white/20 backdrop-blur-sm`}
  >
    <div className="flex items-center space-x-4">
      <div className={`p-3 ${color} rounded-2xl shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        {trend && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">{trend}</p>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  </motion.div>
)

export default ProfilePage
