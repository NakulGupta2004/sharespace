import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShoppingCart, 
  User, 
  Phone,
  GraduationCap,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college_id: '',
    phone: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    setIsLoading(true)
    
    const success = await register(formData)
    if (success) {
      setStep(3) // Success step
    }
    
    setIsLoading(false)
  }

  const validateStep1 = () => {
    return formData.name && formData.email && formData.college_id
  }

  const validateStep2 = () => {
    return formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
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
            
            {step === 1 && (
              <>
                <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                  Join your campus
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Connect with your college community
                </p>
              </>
            )}
            
            {step === 2 && (
              <>
                <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                  Secure your account
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Create a strong password
                </p>
              </>
            )}
            
            {step === 3 && (
              <>
                <div className="mt-6 flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                  Check your email!
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  We've sent a verification link to {formData.email}
                </p>
              </>
            )}
          </div>

          {/* Progress Steps */}
          {step < 3 && (
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 1 ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <div className={`h-1 w-16 ${step >= 2 ? 'bg-cyan-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= 2 ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Basic Info</span>
                <span>Security</span>
              </div>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <form className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-600" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-white/60 dark:bg-gray-700/60 py-3 pl-12 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 font-medium backdrop-blur-sm"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-600" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-white/60 dark:bg-gray-700/60 py-3 pl-12 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 font-medium backdrop-blur-sm"
                    placeholder="your.email@college.edu"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Must be your official college email address
                </p>
              </div>

              {/* College ID */}
              <div>
                <label htmlFor="college_id" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Student ID
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-600" />
                  <input
                    id="college_id"
                    name="college_id"
                    type="text"
                    value={formData.college_id}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-white/60 dark:bg-gray-700/60 py-3 pl-12 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 font-medium backdrop-blur-sm"
                    placeholder="Your student ID"
                  />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-600" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-gray-200 bg-white/60 dark:bg-gray-700/60 py-3 pl-12 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 font-medium backdrop-blur-sm"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep(2)}
                disabled={!validateStep1()}
                className="w-full rounded-2xl bg-cyan-600 hover:bg-cyan-700 py-3 text-white font-bold transition-all shadow-lg hover:shadow-xl active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600"
              >
                Continue
              </motion.button>
            </form>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-600" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-white/60 dark:bg-gray-700/60 py-3 pl-12 pr-12 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 font-medium backdrop-blur-sm"
                    placeholder="Create a password"
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
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">Passwords do not match</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  I agree to the{' '}
                  <Link to="/terms" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <div className="flex space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 text-gray-700 dark:text-white font-bold transition-all hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md hover:shadow-lg"
                >
                  Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!validateStep2() || isLoading}
                  className="flex-1 rounded-2xl bg-cyan-600 hover:bg-cyan-700 py-3 text-white font-bold transition-all shadow-lg hover:shadow-xl active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </motion.button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 shadow-md">
                <p className="text-sm text-green-700 dark:text-green-300 font-semibold">
                  Please check your email and click the verification link to activate your account.
                </p>
              </div>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')}
                  className="w-full rounded-2xl bg-cyan-600 hover:bg-cyan-700 py-3 text-white font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  Go to Sign In
                </motion.button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-semibold">
                    resend verification
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Sign in link */}
          {step < 3 && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}