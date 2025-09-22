import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
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
  BarChart3
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

// Interface matching your backend Listing model
interface Listing {
  _id: string
  title: string
  description: string
  category: string
  condition: string
  images: Array<{
    url: string
    alt_text?: string
  }>
  image_urls: string[]
  pricing: {
    type: string
    dailyRate?: number
    sellPrice?: number
    depositAmount?: number
  }
  availability: {
    status: string
  }
  location?: {
    pickup: string
  }
  ownerId: {
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
  isActive: boolean
  createdAt: string
  reviews?: number
  views?: number
  interested?: number
  timesRented?: number
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)

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
      
      const response = await axios.get(`http://localhost:5000/api/listings/${listingId}`)
      
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
    
    if (listing.images?.length > 0) {
      images.push(...listing.images.map(img => img.url))
    }
    
    if (listing.image_urls?.length > 0) {
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
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Could not copy link:', err))
    }
  }

  const getPriceDisplay = () => {
    if (!listing?.pricing) return 'Contact for price'
    
    if (listing.pricing.type === 'rent' && listing.pricing.dailyRate) {
      return `₹${listing.pricing.dailyRate}/day`
    } else if (listing.pricing.type === 'sell' && listing.pricing.sellPrice) {
      return `₹${listing.pricing.sellPrice}`
    } else if (listing.pricing.type === 'free') {
      return 'Free'
    }
    return 'Contact for price'
  }

  const getWeeklyPrice = () => {
    if (listing?.pricing?.type === 'rent' && listing.pricing.dailyRate) {
      return `₹${listing.pricing.dailyRate * 7}/week`
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
              
              <button
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium rounded-xl flex justify-center items-center mb-4 hover:from-blue-700 hover:to-green-600 transition-all"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book Now
              </button>
              
              <button
                className="w-full py-4 bg-gray-700 text-white font-medium rounded-xl flex justify-center items-center hover:bg-gray-600 transition-colors"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Message Owner
              </button>
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
                {listing.ownerId.avatar_url ? (
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
                    {listing.ownerId.name}
                  </h3>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-yellow-500 font-medium">4.9</span>
                    <span className="text-gray-400 ml-1">
                      ({listing.reviews || 23} reviews)
                    </span>
                  </div>
                  {listing.ownerId.college && (
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
    </div>
  )
}