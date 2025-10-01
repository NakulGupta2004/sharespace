import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  Search,
  Grid3X3,
  List,
  Star,
  BookOpen, 
  Laptop, 
  Wrench, 
  FlaskConical,
  ArrowLeft,
  SlidersHorizontal
} from 'lucide-react'

interface Listing {
  _id: string
  title: string
  description: string
  category: string
  images: { url: string; alt_text: string }[]
  pricing: {
    type: 'rent' | 'share' | 'sell'
    dailyRate?: number
    amount?: number
    duration?: string
    currency: string
  }
  condition: string
  availability: {
    status: 'available' | 'rented' | 'unavailable'
  }
  ownerId: {
    _id: string
    name: string
    reputation: {
      score: number
      ratingsCount: number
    }
  }
  createdAt: string
}

export default function ListingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    { id: '', name: 'All Categories' },
    { id: 'books', name: 'Books', icon: BookOpen },
    { id: 'electronics', name: 'Electronics', icon: Laptop },
    { id: 'tools', name: 'Tools', icon: Wrench },
    { id: 'lab-kits', name: 'Lab Kits', icon: FlaskConical },
  ]

  useEffect(() => {
    fetchListings()
  }, [searchQuery, categoryFilter, sortBy])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (searchQuery) params.append('search', searchQuery)
      if (categoryFilter) params.append('category', categoryFilter)
      if (sortBy === 'recent') params.append('sort', '-createdAt')
      if (sortBy === 'price-low') params.append('sort', 'pricing.dailyRate')
      if (sortBy === 'price-high') params.append('sort', '-pricing.dailyRate')
      
      params.append('limit', '50')

      const response = await axios.get(`http://localhost:5000/api/listings?${params}`)
      if (response.data.success) {
        setListings(response.data.listings || [])
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (categoryFilter) params.set('category', categoryFilter)
    setSearchParams(params)
    fetchListings()
  }

  const formatPrice = (listing: Listing) => {
    if (listing.pricing?.dailyRate) {
      return `₹${listing.pricing.dailyRate}/day`
    }
    if (listing.pricing?.amount) {
      const { pricing } = listing
      if (pricing.type === 'share') return 'Share'
      if (pricing.type === 'sell') return `₹${pricing.amount}`
      return `₹${pricing.amount}/${pricing.duration || 'day'}`
    }
    return '₹0/day'
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'books': return BookOpen
      case 'electronics': return Laptop
      case 'tools': return Wrench
      case 'lab-kits': return FlaskConical
      default: return BookOpen
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/20 dark:bg-white/10 border-b border-white/20 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Browse Items
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 backdrop-blur-md bg-white/20 dark:bg-white/10 px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300"
              >
                <SlidersHorizontal className="h-5 w-5" />
                <span>Filters</span>
              </button>
              
              <div className="flex items-center backdrop-blur-md bg-white/20 dark:bg-white/10 rounded-full border border-white/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'grid' ? 'bg-white/30' : 'hover:bg-white/20'}`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-all duration-300 ${viewMode === 'list' ? 'bg-white/30' : 'hover:bg-white/20'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative backdrop-blur-xl bg-white/20 dark:bg-white/10 border border-white/30 rounded-2xl p-2">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600 dark:text-gray-300" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search for items..."
                    className="w-full rounded-xl bg-transparent py-3 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl bg-transparent py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/20"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id} className="bg-gray-800">
                      {category.name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handleSearch}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-white font-medium transition-all hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="backdrop-blur-xl bg-white/20 dark:bg-white/10 border border-white/30 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-lg bg-white/30 dark:bg-white/10 border border-white/30 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="recent" className="bg-gray-800">Most Recent</option>
                      <option value="price-low" className="bg-gray-800">Price: Low to High</option>
                      <option value="price-high" className="bg-gray-800">Price: High to Low</option>
                    </select>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {listings.length} items found
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {Array.from({ length: 12 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="backdrop-blur-xl bg-white/30 dark:bg-white/10 border border-white/20 rounded-3xl overflow-hidden"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-lg w-3/4 mb-3 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-lg w-1/2 mb-4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-lg w-1/4 animate-pulse"></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {listings.map((listing, index) => {
              const CategoryIcon = getCategoryIcon(listing.category)
              return (
                <motion.div
                  key={listing._id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group cursor-pointer"
                >
                  <Link to={`/listing/${listing._id}`}>
                    <div className="overflow-hidden rounded-3xl backdrop-blur-xl bg-white/40 dark:bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:bg-white/60 dark:group-hover:bg-white/20">
                      <div className="relative overflow-hidden">
                        <div className="aspect-[4/3] overflow-hidden">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0].url}
                              alt={listing.images[0].alt_text || listing.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-gray-400 dark:text-gray-500">
                              <CategoryIcon className="h-12 w-12" />
                            </div>
                          )}
                        </div>
                        
                        <div className="absolute top-4 right-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md border ${
                            listing.availability.status === 'available' 
                              ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30'
                              : 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30'
                          }`}>
                            {listing.availability.status === 'available' ? 'Available' : 'Unavailable'}
                          </span>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-2">
                              {listing.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {listing.category.replace('-', ' ')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {listing.ownerId?.reputation?.score?.toFixed(1) || '0.0'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({listing.ownerId?.reputation?.ratingsCount || 0})
                            </span>
                          </div>
                          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {formatPrice(listing)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <span>Listed by</span>
                          <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">
                            {listing.ownerId?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="backdrop-blur-xl bg-white/20 dark:bg-white/10 border border-white/20 rounded-3xl p-12 max-w-md mx-auto">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No items found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Try adjusting your search terms or filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('')
                  setSearchParams({})
                  fetchListings()
                }}
                className="backdrop-blur-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-full border border-blue-500/30 transition-all duration-300"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}