import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ShoppingCart, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const token = searchParams.get('token')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        toast.success('Password reset successfully!')
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        toast.error(data.message || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]"></div>
        
        <div className="absolute top-10 right-20 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full relative z-10 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block rounded-2xl bg-cyan-600 hover:bg-cyan-700 px-6 py-3 text-white font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Request New Link
          </Link>
        </motion.div>
      </div>
    )
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
          </div>

          {!success ? (
            <>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-2">
                Create new password
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-300 font-medium mb-8">
                Enter a strong password to secure your account
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password
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
                      placeholder="Create a strong password"
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

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-600" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-gray-200 bg-white/60 dark:bg-gray-700/60 py-3 pl-12 pr-12 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 font-medium backdrop-blur-sm"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="mt-2 text-xs text-red-500 font-semibold">Passwords do not match</p>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || password !== confirmPassword}
                  className="w-full rounded-2xl bg-cyan-600 hover:bg-cyan-700 py-3 text-white font-bold transition-all shadow-lg hover:shadow-xl active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600 text-lg mt-6"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </motion.button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold transition-colors"
                >
                  Back to Sign in
                </Link>
              </div>
            </>
          ) : (
            // Success State
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="flex justify-center"
              >
                <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-4">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Password reset successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  Your password has been updated. You can now sign in with your new password.
                </p>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Redirecting to sign in in 3 seconds...
              </p>

              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full rounded-2xl bg-cyan-600 hover:bg-cyan-700 py-3 text-white font-bold transition-all shadow-lg hover:shadow-xl"
              >
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
