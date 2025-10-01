import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Plus, 
  BookOpen, 
  Calendar, 
  Star, 
  TrendingUp, 
  Clock,
  Package,
  Edit3,
  Eye,
  Trash2,
  Settings,
  BarChart3,
  DollarSign
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

interface Listing {
  _id: string
  title: string
  description: string
  category: string
  images: { url: string; alt_text: string }[]
  pricing: {
    type: 'rent' | 'share' | 'sell'
    amount?: number
    duration?: string
    currency: string
  }
  condition: string
  availability: {
    status: 'available' | 'rented' | 'unavailable'
    start_date?: string
    end_date?: string
  }
  ownerId: string
  location: string
  tags: string[]
  createdAt: string
  views?: number
}

interface Booking {
  _id: string
  listingId: Listing
  borrowerId: string
  ownerId: string
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  totalAmount: number
  createdAt: string
}

interface DashboardStats {
  totalListings: number
  activeListings: number
  totalViews: number
  totalEarnings: number
  pendingBookings: number
  activeBookings: number
  completedBookings: number
  reputation: number
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    reputation: 0
  })
  
  const [recentListings, setRecentListings] = useState<Listing[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
      return
    }
    
    if (user) {
      fetchDashboardData()
    }
  }, [user, loading, navigate])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch user's listings
      const listingsResponse = await axios.get('/api/listings/my')
      const userListings = listingsResponse.data?.data || listingsResponse.data || []
      
      // Fetch user's bookings (with fallback if not implemented)
      let userBookings = []
      try {
        const bookingsResponse = await axios.get('/api/bookings/my')
        userBookings = bookingsResponse.data?.data || bookingsResponse.data || []
      } catch (bookingError) {
        console.log('Bookings endpoint not available, using empty array')
        userBookings = []
      }
      
      // Calculate stats
      const calculatedStats = calculateStats(userListings, userBookings)
      setStats(calculatedStats)
      
      // Set recent listings (last 5)
      setRecentListings(userListings.slice(0, 5))
      
      // Set recent bookings (last 5)
      setRecentBookings(userBookings.slice(0, 5))
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      
      // If it's a network error (backend not running), show different message
      if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        toast.error('Cannot connect to server. Please make sure the backend is running.')
      } else {
        toast.error('Failed to load dashboard data')
      }
      
      // Set empty data so the UI still renders
      setRecentListings([])
      setRecentBookings([])
      setStats({
        totalListings: 0,
        activeListings: 0,
        totalViews: 0,
        totalEarnings: 0,
        pendingBookings: 0,
        activeBookings: 0,
        completedBookings: 0,
        reputation: user?.reputation.score || 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (listings: Listing[], bookings: Booking[]): DashboardStats => {
    const totalListings = listings.length
    const activeListings = listings.filter(l => l.availability.status === 'available').length
    const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0)
    
    const pendingBookings = bookings.filter(b => b.status === 'pending').length
    const activeBookings = bookings.filter(b => b.status === 'active').length
    const completedBookings = bookings.filter(b => b.status === 'completed').length
    const totalEarnings = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, booking) => sum + booking.totalAmount, 0)
    
    return {
      totalListings,
      activeListings,
      totalViews,
      totalEarnings,
      pendingBookings,
      activeBookings,
      completedBookings,
      reputation: user?.reputation.score || 0
    }
  }

  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return
    }
    
    try {
      await axios.delete(`/api/listings/${listingId}`)
      toast.success('Listing deleted successfully')
      fetchDashboardData() // Refresh data
    } catch (error) {
      toast.error('Failed to delete listing')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100'
      case 'rented':
        return 'text-blue-600 bg-blue-100'
      case 'unavailable':
        return 'text-gray-600 bg-gray-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'approved':
        return 'text-blue-600 bg-blue-100'
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'completed':
        return 'text-gray-600 bg-gray-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.name}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Here's what's happening with your ShareSpace account.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link to="/create-listing">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Listing
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Listings
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalListings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Listings
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.activeListings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Views
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalViews}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalEarnings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/create-listing">
                  <div className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Plus className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Add Listing
                    </p>
                  </div>
                </Link>
                
                <Link to="/listings">
                  <div className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Browse Items
                    </p>
                  </div>
                </Link>
                
                <div className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Analytics
                  </p>
                </div>
                
                <div className="p-4 text-center border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Listings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Listings</CardTitle>
              </CardHeader>
              <CardContent>
                {recentListings.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      You haven't created any listings yet.
                    </p>
                    <Link to="/create-listing">
                      <Button className="mt-4">Create Your First Listing</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentListings.map((listing) => (
                      <div
                        key={listing._id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          {listing.images.length > 0 ? (
                            <img
                              src={listing.images[0].url}
                              alt={listing.images[0].alt_text}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {listing.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {listing.category} • {formatDate(listing.createdAt)}
                            </p>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                listing.availability.status
                              )}`}
                            >
                              {listing.availability.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link to={`/listing/${listing._id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteListing(listing._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {recentBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No recent bookings found.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {booking.listingId.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatCurrency(booking.totalAmount)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Booked {formatDate(booking.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Booking Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Booking Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-yellow-100 rounded-lg inline-block mb-2">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pendingBookings}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pending Bookings
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="p-3 bg-green-100 rounded-lg inline-block mb-2">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.activeBookings}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active Bookings
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="p-3 bg-blue-100 rounded-lg inline-block mb-2">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.completedBookings}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Completed Bookings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}