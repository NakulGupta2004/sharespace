import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Star, 
  Calendar,
  MessageCircle,
  User,
  Shield,
  CheckCircle,
  Eye,
  Users,
  BarChart3,
  X,
  ShoppingCart,
  Gift
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { showToast } from '../utils/toast'
import { useAuth } from '../context/AuthContext'

// Interface matching your backend Listing model
interface Listing {
  _id: string
  title: string
  description: string
  category: string
  condition: string
  images?: Array<{
    url: string
    alt_text?: string
  }>
  image_urls?: string[]
  pricing?: {
    type: string
    basePrice?: number
    dailyRate?: number
    sellPrice?: number
    depositAmount?: number
  }
  availability?: {
    status: string
  }
  location?: {
    pickup?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
  }
  ownerId?: {
    _id: string
    name: string
    email: string
    avatar_url?: string
    reputation?: {
      score: number
      ratingsCount: number
    }
    college?: string
  }
  isActive?: boolean
  createdAt?: string
  reviews?: number
  views?: number
  interested?: number
  timesRented?: number
  isFavorited?: boolean
}

export default function ListingDetailPage() {
  // ...existing code...
  const handleAddOwnerToFriends = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const token = localStorage.getItem('sharespace_token');
      const ownerId = listing?.ownerId?._id;
      if (!ownerId) return;
      const response = await api.post(`/api/users/add-friend/${ownerId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        showToast.success('Owner added to your chat contacts!');
      } else {
        showToast.error(response.data.message || 'Could not add owner to contacts');
      }
    } catch (error: any) {
      console.error('Add friend error:', error);
      showToast.error(error.response?.data?.message || 'Error adding owner to contacts');
    }
  };
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    notes: '',
    barterItem: ''
  })
  const [bookingLoading, setBookingLoading] = useState(false)



  useEffect(() => {
    if (id) {
      fetchListing(id)
    }
  }, [id])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const calculateDaysDiff = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const calculateTotal = () => {
    if (!bookingData.startDate || !bookingData.endDate || !listing?.pricing?.dailyRate) {
      return 0
    }
    const daysDiff = calculateDaysDiff(bookingData.startDate, bookingData.endDate)
    const totalAmount = daysDiff * (listing.pricing?.dailyRate || 0)
    return totalAmount
  }

  // Custom popup state
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const handleBooking = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    // Prepare booking payload
    const payload: any = {
      listingId: id,
      notes: bookingData.notes
    };
    if (listing?.pricing?.type === 'rent') {
      if (!bookingData.startDate || !bookingData.endDate) {
        showToast.warning('Please select both start and end dates')
        return
      }
      payload.startDate = bookingData.startDate;
      payload.endDate = bookingData.endDate;
    }
    if (listing?.pricing?.type === 'barter') {
      if (bookingData.barterItem) payload.barterItem = bookingData.barterItem;
    }

    setBookingLoading(true);
    try {
      const token = localStorage.getItem('sharespace_token');
      const response = await api.post('/api/bookings', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        showToast.success('Booking request sent successfully!');
        setShowBookingModal(false);
        setBookingData({ startDate: '', endDate: '', notes: '', barterItem: '' });
        setShowApprovalPopup(true);
        setTimeout(() => setShowApprovalPopup(false), 3500);
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      showToast.error(error.response?.data?.message || 'Error creating booking');
    } finally {
      setBookingLoading(false);
    }
  }



  useEffect(() => {
    if (id) {
      fetchListing(id)
    }
  }, [id])

  const fetchListing = async (listingId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Validate ObjectId format on frontend
      if (!listingId || listingId.length !== 24) {
        setError('Invalid listing ID')
        return
      }
      
      const response = await api.get(`/api/listings/${listingId}`)
      
      if (response.data?.success && response.data?.listing) {
        setListing(response.data.listing)
      } else {
        setError('Listing not found')
      }
    } catch (err: any) {
      console.error('Error fetching listing:', err)
      
      // Better error handling based on response status
      if (err.response) {
        const status = err.response.status
        const message = err.response.data?.message
        
        switch (status) {
          case 400:
            setError(message || 'Invalid listing ID format')
            break
          case 404:
            setError('Listing not found')
            break
          case 500:
            setError('Server error. Please try again later.')
            break
          default:
            setError('Failed to load listing details')
        }
      } else if (err.request) {
        setError('Unable to connect to server. Please check your connection.')
      } else {
        setError('Failed to load listing details')
      }
    } finally {
      setLoading(false)
    }
  }

  // Get all available images
  const getAllImages = () => {
    if (!listing) return []
    const images = []
    
    if (listing.images && listing.images.length > 0) {
      images.push(...listing.images.map(img => img.url))
    }
    
    if (listing.image_urls && listing.image_urls.length > 0) {
      images.push(...listing.image_urls)
    }
    
    // If no images, add a placeholder
    if (images.length === 0) {
      images.push('https://via.placeholder.com/800x400?text=No+Image')
    }
    
    return images
  }

  const images = getAllImages()

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  const handleFavorite = () => {
    setIsFavorited(prev => !prev)
    // Add API call to save favorite status
  }

  const handleShare = () => {
    // Implement share functionality
    if (navigator.share && listing) {
      navigator.share({
        title: listing.title,
        text: listing.description,
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err))
    } else {
      // Fallback - copy link to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToast.success('Link copied to clipboard!'))
        .catch(err => console.error('Could not copy link:', err))
    }
  }

  const getPriceDisplay = () => {
    if (!listing?.pricing) return 'Contact for price'
    
    if (listing.pricing.type === 'rent' && listing.pricing.basePrice) {
      return `₹${listing.pricing.basePrice}/day`
    } else if (listing.pricing.type === 'rent' && listing.pricing.dailyRate) {
      return `₹${listing.pricing.dailyRate}/day`
    } else if (listing.pricing.type === 'sell' && listing.pricing.sellPrice) {
      return `₹${listing.pricing.sellPrice}`
    } else if (listing.pricing.type === 'free') {
      return 'Free'
    } else if (listing.pricing.type === 'barter') {
      return 'Exchange'
    }
    return 'Contact for price'
  }

  const getWeeklyPrice = () => {
    if (listing?.pricing?.type === 'rent') {
      const dailyRate = listing.pricing.basePrice || listing.pricing.dailyRate
      if (dailyRate) {
        return `₹${dailyRate * 7}/week`
      }
    }
    return ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading listing details...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Listing not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The listing you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with back button */}
      <div className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to listings
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="relative">
                <img
                  src={images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-[400px] object-cover"
                />
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
                    >
                      <ChevronLeft className="h-6 w-6 text-white" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
                    >
                      <ChevronRight className="h-6 w-6 text-white" />
                    </button>
                  </>
                )}
                
                {/* Image Controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={handleFavorite}
                    className={`bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all ${isFavorited ? 'text-red-500' : 'text-white'}`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all"
                  >
                    <Share2 className="h-5 w-5 text-white" />
                  </button>
                </div>
                
                {/* Thumbnail navigation */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Listing Title & Description */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                {listing.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-300">
                <div className="flex items-center">
                  <span className="text-sm bg-gray-700 px-3 py-1 rounded-full">
                    {listing.category}
                  </span>
                </div>
                {listing.condition && (
                  <div className="flex items-center">
                    <span className="text-sm bg-green-700 px-3 py-1 rounded-full">
                      {listing.condition}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-gray-300 mb-6 whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          </div>
          
          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{getPriceDisplay()}</span>
                {getWeeklyPrice() && (
                  <div className="mt-1 text-gray-400 text-sm">
                    {getWeeklyPrice()}
                  </div>
                )}
              </div>

              {/* Only show booking/chat buttons if user is NOT the owner */}
              {user && listing.ownerId?._id !== user.id ? (
                <>
                  {listing.pricing?.type === 'rent' && (
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium rounded-xl flex justify-center items-center mb-4 hover:from-blue-700 hover:to-green-600 transition-all"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Book Now
                    </button>
                  )}
                  {listing.pricing?.type === 'sell' && (
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-500 text-white font-medium rounded-xl flex justify-center items-center mb-4 hover:from-green-700 hover:to-blue-600 transition-all"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Buy Now
                    </button>
                  )}
                  {listing.pricing?.type === 'barter' && (
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-xl flex justify-center items-center mb-4 hover:from-purple-700 hover:to-pink-600 transition-all"
                    >
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Barter Now
                    </button>
                  )}
                  {listing.pricing?.type === 'free' && (
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full py-4 bg-gradient-to-r from-gray-600 to-green-500 text-white font-medium rounded-xl flex justify-center items-center mb-4 hover:from-gray-700 hover:to-green-600 transition-all"
                    >
                      <Gift className="h-5 w-5 mr-2" />
                      Get Now
                    </button>
                  )}
                  <button
                    onClick={handleAddOwnerToFriends}
                    className="w-full py-4 bg-gray-700 text-white font-medium rounded-xl flex justify-center items-center hover:bg-gray-600 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Add Owner to Chat Contacts
                  </button>
                </>
              ) : (
                // If owner, show Edit button
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="default"
                  className="w-full py-4 font-medium rounded-xl flex justify-center items-center mb-4"
                >
                  Edit using Dashboard
                </Button>
              )}
            </div>
            
            {/* Owner Card */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Item Statistics
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Views
                  </span>
                  <span className="font-medium text-white">
                    {listing.views || 124}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    Interested
                  </span>
                  <span className="font-medium text-white">
                    {listing.interested || 8}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Times rented
                  </span>
                  <span className="font-medium text-white">
                    {listing.timesRented || 15}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Owner Card */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                {listing.ownerId?.avatar_url ? (
                  <img 
                    src={listing.ownerId.avatar_url} 
                    alt={`${listing.ownerId.name}'s avatar`}
                    className="h-12 w-12 rounded-full mr-3"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                    <User className="h-6 w-6 text-gray-300" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-white">
                    {listing.ownerId?.name}
                  </h3>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-yellow-500 font-medium">4.9</span>
                    <span className="text-gray-400 ml-1">
                      ({listing.reviews || 23} reviews)
                    </span>
                  </div>
                  {listing.ownerId?.college && (
                    <div className="text-sm text-gray-400 mt-1">
                      {listing.ownerId.college}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Response time:</span>
                  <span className="text-white">~2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Member since:</span>
                  <span className="text-white">15/08/2023</span>
                </div>
              </div>
            </div>
            
            {/* Safety Tips */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-white">Safety Tips</h3>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Meet in public campus locations</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Check the item before paying</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Pay only after receiving the item</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal logic for each pricing type */}
      {showBookingModal && listing.pricing?.type === 'rent' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Book {listing?.title}</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={bookingData.startDate}
                  onChange={(e) => setBookingData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={bookingData.endDate}
                  onChange={(e) => setBookingData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any special requirements or notes..."
                />
              </div>
              {bookingData.startDate && bookingData.endDate && (
                <div className="bg-gray-700 p-3 rounded-md">
                  <div className="flex justify-between text-gray-300">
                    <span>Days: {calculateDaysDiff(bookingData.startDate, bookingData.endDate)}</span>
                    <span>Rate: {formatPrice(listing?.pricing?.dailyRate || 0)}/day</span>
                  </div>
                  <div className="flex justify-between font-bold text-white mt-2">
                    <span>Total: {formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading || !bookingData.startDate || !bookingData.endDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? 'Booking...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showBookingModal && listing.pricing?.type === 'sell' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Buy {listing?.title}</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="text-lg text-white">Price: {formatPrice(listing?.pricing?.sellPrice || 0)}</div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleBooking} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Buy Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showBookingModal && listing.pricing?.type === 'barter' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Barter for {listing?.title}</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="text-lg text-white">Propose your item to barter with the owner.</div>
              <input type="text" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" placeholder="Describe your item..." />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleBooking} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">Send Barter Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showBookingModal && listing.pricing?.type === 'free' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Claim {listing?.title}</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="text-lg text-white">This item is free! Click below to claim it.</div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleBooking} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">Claim Now</button>
              </div>
            </div>
          </div>
        </div>
      )}


    {/* Approval Popup */}
    {showApprovalPopup && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={() => setShowApprovalPopup(false)}
      >
        <div className="bg-gray-900 border border-blue-600 rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center animate-fade-in">
          <svg width="48" height="48" fill="none" className="mb-3">
            <circle cx="24" cy="24" r="22" stroke="#3B82F6" strokeWidth="4" fill="#1E293B" />
            <path d="M16 24l6 6 10-10" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Waiting for Buyer Approval</h2>
          <p className="text-gray-300 mb-4 text-center">Your request has been sent. Please wait for the seller to approve your purchase or claim.</p>
          <button
            className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
            onClick={() => setShowApprovalPopup(false)}
          >Close</button>
        </div>
      </div>
    )}
    </div>
  )
}