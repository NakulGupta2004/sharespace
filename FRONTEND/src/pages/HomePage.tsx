import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../utils/api'
import { 
  Search, 
  BookOpen, 
  Laptop, 
  Wrench, 
  FlaskConical,
  ArrowRight,
  Star,
  Shield,
  Clock,
  Users
} from 'lucide-react'

interface Listing {
  _id: string
  title: string
  description: string
  category: string
  images: { url: string; alt_text: string }[]
  pricing: {
    type: 'rent' | 'sell' | 'free' | 'barter'
    hourlyRate?: number
    dailyRate?: number
    sellPrice?: number
    depositAmount?: number
  }
  condition: string
  availability: {
    status: 'available' | 'rented' | 'unavailable'
    start_date?: string
    end_date?: string
  }
  ownerId: {
    _id: string
    name: string
    email: string
    avatar_url?: string
    reputation: {
      score: number
      ratingsCount: number
    }
  }
  location: string
  tags: string[]
  createdAt: string
}

export default function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryCounts, setCategoryCounts] = useState({
    books: 0,
    electronics: 0,
    tools: 0,
    'lab-kits': 0
  })

  useEffect(() => {
    fetchListings()
    fetchCategoryCounts()
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/listings')
    }
  }

  useEffect(() => {
    fetchListings()
    fetchCategoryCounts()
  }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      // Fetch all available listings (increased limit to show more items)
      const response = await api.get('/api/listings?limit=20&sort=-createdAt')
      if (response.data.success) {
        setListings(response.data.listings || [])
      }
    } catch (error: any) {
      console.error('Error fetching listings:', error)
      // Set empty array so the UI still renders properly
      setListings([])
      
      // Only show error toast for actual errors, not network issues
      if (error.response?.status !== 500 && !error.message.includes('ERR_CONNECTION_REFUSED')) {
        // Optional: show a subtle error message
        console.log('Failed to load listings, showing empty state')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryCounts = async () => {
    try {
      const response = await api.get('/api/listings/categories/stats')
      if (response.data.success) {
        const counts: { [key: string]: number } = {}
        
        // Convert array format to object format
        response.data.categories.forEach((cat: { category: string; count: number }) => {
          counts[cat.category] = cat.count
        })
        
        setCategoryCounts({
          books: counts.books || 0,
          electronics: counts.electronics || 0,
          tools: counts.tools || 0,
          'lab-kits': counts['lab-kits'] || 0
        })
      }
    } catch (error) {
      console.error('Error fetching category counts:', error)
      // Set default values if API fails
      setCategoryCounts({
        books: 0,
        electronics: 0,
        tools: 0,
        'lab-kits': 0
      })
    }
  }

  const categories = [
    {
      id: 'books',
      name: 'Books',
      icon: BookOpen,
      color: 'bg-blue-600',
      bgColor: 'bg-blue-600',
      count: categoryCounts.books
    },
    {
      id: 'electronics',
      name: 'Electronics',
      icon: Laptop,
      color: 'bg-green-600',
      bgColor: 'bg-green-600',
      count: categoryCounts.electronics
    },
    {
      id: 'tools',
      name: 'Tools',
      icon: Wrench,
      color: 'bg-purple-600',
      bgColor: 'bg-purple-600',
      count: categoryCounts.tools
    },
    {
      id: 'lab-kits',
      name: 'Lab Kits',
      icon: FlaskConical,
      color: 'bg-cyan-600',
      bgColor: 'bg-cyan-600',
      count: categoryCounts['lab-kits']
    },
  ]

  const totalItems = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
  
  const stats = [
    { label: 'Active Students', value: '2,500+', icon: Users },
    { label: 'Items Listed', value: totalItems > 0 ? `${totalItems}` : '0', icon: BookOpen },
    { label: 'Successful Swaps', value: '1,200+', icon: Star },
    { label: 'Avg Response Time', value: '< 2 hrs', icon: Clock },
  ]

  const formatPrice = (listing: Listing) => {
    const { pricing } = listing
    if (pricing.type === 'rent') {
      return `₹${pricing.dailyRate || pricing.hourlyRate || 0}/day`
    }
    if (pricing.type === 'sell') {
      return `₹${pricing.sellPrice || 0}`
    }
    if (pricing.type === 'free') {
      return 'Free'
    }
    if (pricing.type === 'barter') {
      return 'Exchange'
    }
    return '₹0/day'
  }

  const getAvailabilityStatus = (listing: Listing) => {
    return listing.availability?.status === 'available' ? 'Available' : 'Unavailable'
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 bg-black/0"></div>
          {/* Floating Shapes with Enhanced Glass Effect */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/8 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-96 h-96 bg-cyan-400/6 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.08)_2px,transparent_2px),linear-gradient(90deg,rgba(0,0,0,0.08)_2px,transparent_2px)] bg-[size:100px_100px] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.05)_2px,transparent_2px)]"></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-1 sm:px-2 lg:px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white mb-8 tracking-tight"
            >
              <span className="text-cyan-600">
                Share
              </span>
              <span className="text-gray-900 dark:text-white">Space</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mx-auto mt-6 max-w-3xl text-2xl md:text-3xl leading-relaxed text-gray-700 dark:text-gray-300 mb-16 font-light"
            >
              Connect with your campus community to share, rent, and exchange items safely. 
              From textbooks to tech gear, find what you need or earn by sharing what you have.
            </motion.p>

              {/* Glassy Search Bar with Enhanced Effect */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mx-auto max-w-2xl mb-12"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  <div className="relative backdrop-blur-2xl bg-white/60 dark:bg-gray-800/60 border border-white/30 dark:border-gray-700/50 rounded-2xl p-2 shadow-2xl hover:shadow-3xl transition-all duration-300 group-hover:border-blue-300/50 dark:group-hover:border-blue-400/30">
                    <div className="relative">
                      <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search items, books, or kits..."
                        className="w-full rounded-xl bg-transparent py-5 pl-16 pr-32 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-lg font-medium tracking-wide"
                      />
                      <button
                        onClick={handleSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-cyan-600 px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-cyan-700 hover:scale-110 hover:shadow-xl shadow-lg active:scale-95"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>            {/* Trust Indicators with Enhanced Glass Effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-700 dark:text-gray-300"
            >
              <div className="flex items-center space-x-2 backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 px-6 py-3 rounded-full border border-white/40 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-300 shadow-lg hover:shadow-xl">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="font-medium">College Verified</span>
              </div>
              <div className="flex items-center space-x-2 backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 px-6 py-3 rounded-full border border-white/40 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-300 shadow-lg hover:shadow-xl">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">4.9 Rating</span>
              </div>
              <div className="flex items-center space-x-2 backdrop-blur-xl bg-white/40 dark:bg-gray-800/40 px-6 py-3 rounded-full border border-white/40 dark:border-gray-700/50 hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-300 shadow-lg hover:shadow-xl">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">2500+ Students</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce"></div>
          </div>
        </motion.div>
      </section>
      {/* Categories */}
      <section className="relative py-24 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(0,0,0,0.05)_2px,transparent_2px)] bg-[size:80px_80px] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.03)_2px,transparent_2px)]"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-400/6 rounded-full blur-3xl"></div>
        
        <div className="relative mx-auto max-w-7xl px-1 sm:px-2 lg:px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Browse by Category
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-light">
              Discover items across different categories
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -15, scale: 1.08 }}
                className="group cursor-pointer"
              >
                <Link to={`/listings?category=${category.id}`}>
                  <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/50 p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:border-blue-300/50 dark:group-hover:border-blue-400/30 group-hover:bg-white/80 dark:group-hover:bg-gray-800/80">
                    {/* Subtle color overlay on hover */}
                    <div className={`absolute inset-0 ${category.color} opacity-0 group-hover:opacity-3 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      <div className={`w-24 h-24 rounded-3xl ${category.bgColor} flex items-center justify-center mb-8 group-hover:scale-130 group-hover:rotate-12 transition-all duration-500 shadow-2xl`}>
                        <category.icon className="h-12 w-12 text-white" />
                      </div>
                      
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300 tracking-tight">
                        {category.name}
                      </h3>
                      
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 font-medium">
                        {category.count} items available
                      </p>
                      
                      <div className="flex items-center text-cyan-600 dark:text-cyan-400 font-bold group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors duration-300 text-lg">
                        <span>Explore Now</span>
                        <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-3 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Items Listed */}
      <section className="relative py-24 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-400/6 rounded-full blur-3xl"></div>
        
        <div className="relative mx-auto max-w-7xl px-1 sm:px-2 lg:px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-between mb-20"
          >
            <div>
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                Featured Items
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light">
                Trending items available from our community
              </p>
            </div>
            <Link
              to="/listings"
              className="hidden sm:flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-bold backdrop-blur-xl bg-cyan-100/50 dark:bg-cyan-900/40 border border-cyan-200/50 dark:border-cyan-800/50 px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg text-lg"
            >
              <span>View all</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading ? (
              // Enhanced Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="overflow-hidden rounded-3xl backdrop-blur-xl bg-white/40 dark:bg-gray-700/40 border border-white/30 dark:border-gray-600/30 shadow-xl">
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 animate-pulse"></div>
                    <div className="p-6">
                      <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4 mb-3 animate-pulse"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/2 mb-4 animate-pulse"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/4 animate-pulse"></div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : listings.length > 0 ? (
              listings.map((listing, index) => {
                const CategoryIcon = getCategoryIcon(listing.category)
                return (
                  <motion.div
                    key={listing._id}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group cursor-pointer"
                  >
                    <Link to={`/listing/${listing._id}`}>
                      <div className="overflow-hidden rounded-3xl backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border border-white/40 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:border-blue-300/50 dark:group-hover:border-blue-400/30 group-hover:bg-white/90 dark:group-hover:bg-gray-800/90">
                        <div className="relative overflow-hidden">
                          <div className="aspect-[4/3] overflow-hidden">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0].url}
                                alt={listing.images[0].alt_text || listing.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                            ) : null}
                            <div className="hidden flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
                              <CategoryIcon className="h-12 w-12" />
                            </div>
                          </div>
                          
                          {/* Status Badge with Enhanced Glass */}
                          <div className="absolute top-4 right-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-xl border ${
                              listing.availability.status === 'available' 
                                ? 'bg-green-500/40 text-green-700 dark:text-green-300 border-green-500/50'
                                : 'bg-red-500/40 text-red-700 dark:text-red-300 border-red-500/50'
                            } shadow-lg`}>
                              {getAvailabilityStatus(listing)}
                            </span>
                          </div>

                          {/* Gradient Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1 mb-2">
                                {listing.title}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize font-medium">
                                {listing.category.replace('-', ' ')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-1">
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {listing.ownerId?.reputation?.score?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({listing.ownerId?.reputation?.ratingsCount || 0})
                              </span>
                            </div>
                            <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
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
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16"
              >
              <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-gray-700/50 rounded-3xl p-12 shadow-lg">
                  <div className="text-gray-400 text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No items available</h3>
                  <p className="text-gray-500 dark:text-gray-400">Check back later for new listings.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 bg-white dark:bg-gray-900">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:50px_50px] dark:bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)]"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-1 sm:px-2 lg:px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Why Choose ShareSpace?
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light">
              Join thousands of students saving money and making connections
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border border-white/40 dark:border-gray-700/50 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/70 dark:hover:bg-gray-800/70 group-hover:scale-105 group-hover:-translate-y-2">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-cyan-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-125 transition-all duration-300">
                      <stat.icon className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="text-5xl font-black text-gray-900 dark:text-white mb-4 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-base font-semibold text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Enhanced Glass Effect */}
      <section className="relative py-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-900 to-blue-800 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 bg-black/20 dark:bg-black/30"></div>
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.04)_2px,transparent_2px)] bg-[size:100px_100px]"></div>
          {/* Animated Orbs with Enhanced Effect */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-400/12 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-1 sm:px-2 lg:px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Enhanced Glass Card */}
            <div className="backdrop-blur-2xl bg-cyan-700 dark:bg-cyan-900 border border-cyan-600/40 dark:border-cyan-700/40 rounded-3xl p-12 md:p-20 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight">
                Ready to Start<br/>
                <span className="text-cyan-200">Sharing?</span>
              </h2>
              <p className="text-2xl md:text-3xl text-white/90 mb-16 max-w-3xl mx-auto leading-relaxed font-light">
                Join thousands of students who are already saving money and building community through ShareSpace.
              </p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              >
                <Link
                  to="/register"
                  className="group relative inline-flex items-center justify-center px-12 py-5 overflow-hidden font-bold text-lg text-cyan-700 rounded-2xl bg-white hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95"
                >
                  <span className="relative group-hover:scale-105 transition-transform duration-300">Join Your Campus</span>
                </Link>
                
                <Link
                  to="/listings"
                  className="group relative inline-flex items-center justify-center px-12 py-5 overflow-hidden font-bold text-lg text-white border-2 border-white rounded-2xl backdrop-blur-xl bg-white/20 hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                >
                  <span className="relative flex items-center">
                    Browse Items
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </Link>
              </motion.div>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-8 hover:bg-white/30 transition-all duration-300 group hover:scale-105">
                  <div className="text-5xl font-black text-white mb-3 group-hover:text-cyan-100 transition-colors">2500+</div>
                  <div className="text-lg text-white/90 font-semibold">Active Students</div>
                </div>
                <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-8 hover:bg-white/30 transition-all duration-300 group hover:scale-105">
                  <div className="text-5xl font-black text-white mb-3 group-hover:text-cyan-100 transition-colors">1200+</div>
                  <div className="text-lg text-white/90 font-semibold">Successful Swaps</div>
                </div>
                <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-8 hover:bg-white/30 transition-all duration-300 group hover:scale-105">
                  <div className="text-5xl font-black text-white mb-3 group-hover:text-cyan-100 transition-colors">&lt; 2hrs</div>
                  <div className="text-lg text-white/90 font-semibold">Avg Response</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}