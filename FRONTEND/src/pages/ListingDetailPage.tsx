import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Share2, 
  Star, 
  User, 
  MessageCircle, 
  Calendar,
  Eye,
  Users,
  BarChart3,
  Shield,
  CheckCircle
} from 'lucide-react'

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
    reputation?: number
  }
  isActive: boolean
  createdAt: string
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
      const response = await axios.get(`http://localhost:3000/api/listings/${listingId}`)
      
      if (response.data?.success && response.data?.listing) {
        setListing(response.data.listing)
      } else {
        setError('Listing not found')
      }
    } catch (err: any) {
      console.error('Error fetching listing:', err)
      setError('Failed to load listing details')
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with back button */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="relative">
                <img
                  src={images[currentImageIndex] || '/api/placeholder/800/400'}
                  alt={listing.title}
                  className="w-full h-96 object-cover"
                />
                
                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isFavorited 
                        ? 'bg-red-500 text-white' 
                        : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                  <button className="w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Image indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="p-4 flex space-x-3 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex 
                          ? 'border-blue-500' 
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              {/* Title and Price */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {listing.title}
                  </h1>
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      📱 {listing.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      listing.condition === 'excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      listing.condition === 'good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {listing.condition} condition
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {getPriceDisplay()}
                  </div>
                  {getWeeklyPrice() && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getWeeklyPrice()}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {listing.description}
              </p>
            </motion.div>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Owner Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  {listing.ownerId.avatar_url ? (
                    <img
                      src={listing.ownerId.avatar_url}
                      alt={listing.ownerId.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {listing.ownerId.name}
                  </h3>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{listing.ownerId.reputation || '4.9'}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">(23 reviews)</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    BITS Pilani
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Response time:</span>
                  <span className="font-medium text-gray-900 dark:text-white">~2 hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Member since:</span>
                  <span className="font-medium text-gray-900 dark:text-white">15/08/2023</span>
                </div>
              </div>

              <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-3">
                <MessageCircle className="h-5 w-5 mr-2" />
                Message Owner
              </button>

              <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all">
                <Calendar className="h-5 w-5 mr-2" />
                Book Now
              </button>
            </motion.div>

            {/* Item Statistics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Item Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Views:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">124</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                    <Heart className="h-4 w-4 mr-2" />
                    Interested:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Times rented:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">15</span>
                </div>
              </div>
            </motion.div>

            {/* Safety Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-6 dark:bg-green-900/20 dark:border-green-800"
            >
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Safety Tips
                  </h3>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Meet in public campus locations</li>
                    <li>• Inspect item before pickup</li>
                    <li>• Use ShareSpace's QR verification</li>
                    <li>• Report any issues immediately</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}