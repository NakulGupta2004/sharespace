import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ShoppingCart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const success = await login(email, password)
    if (success) {
      navigate('/dashboard')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]"></div>
      
      {/* Subtle blur orbs */}
      <div className="absolute top-10 right-20 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-20 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                Share<span className="text-cyan-600">Space</span>
              </span>
            </Link>
            <h2 className="mt-6 text-3xl font-black text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300 font-medium">
              Sign in to your campus community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                College Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-600" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-white/60 dark:bg-gray-700/60 py-3 pl-12 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 font-medium backdrop-blur-sm"
                  placeholder="your.email@college.edu"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-600" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-white/60 dark:bg-gray-700/60 py-3 pl-12 pr-12 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 font-medium backdrop-blur-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-medium">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-cyan-600 hover:bg-cyan-700 py-3 text-white font-bold transition-all shadow-lg hover:shadow-xl active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600 text-lg mt-6"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </motion.button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold transition-colors"
              >
                Join your campus
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}