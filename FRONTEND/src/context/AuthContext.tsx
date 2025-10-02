import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface User {
  _id?: string
  id: string
  name: string
  email: string
  college_id: string
  avatar_url?: string
  is_verified: boolean
  reputation: {
    score: number
    ratingsCount: number
  }
  credits: number
  pendingTeamInvites?: Array<{
    teamId: string
    teamName: string
    invitedBy: string
    date: string
  }>
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  college_id: string
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('sharespace_token')
      if (!token) {
        setLoading(false)
        return
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await api.get('/api/auth/me')
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('sharespace_token')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user } = response.data

      localStorage.setItem('sharespace_token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      toast.success('Welcome back!')
      return true
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
      return false
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await api.post('/api/auth/register', userData)
      const { token, user } = response.data

      localStorage.setItem('sharespace_token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      toast.success('Registration successful! Welcome to ShareSpace!')
      return true
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('sharespace_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}