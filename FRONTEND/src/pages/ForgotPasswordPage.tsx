import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, ShoppingCart, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        toast.success('Password reset link sent to your email')
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        toast.error(data.message || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

          {!submitted ? (
            <>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-2">
                Reset password
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-300 font-medium mb-8">
                Enter your email address and we'll send you a password reset link
              </p>

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

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-cyan-600 hover:bg-cyan-700 py-3 text-white font-bold transition-all shadow-lg hover:shadow-xl active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600 text-lg mt-6"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </motion.button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
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
                  Check your email
                </h3>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  We've sent a password reset link to <span className="font-bold text-cyan-600 dark:text-cyan-400">{email}</span>
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-left">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                  💡 <span className="font-bold">Tip:</span> The reset link will expire in 10 minutes. If you don't receive the email, check your spam folder or try again.
                </p>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Redirecting to sign in in 3 seconds...
              </p>

              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full rounded-2xl bg-cyan-600 hover:bg-cyan-700 py-3 text-white font-bold transition-all shadow-lg hover:shadow-xl"
              >
                Back to Sign in
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
