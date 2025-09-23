import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
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
    type: 'rent' | 'share' | 'sell'
    amount?: number
    dailyRate?: number
    duration?: string
    currency: string
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
      const response = await axios.get('http://localhost:5000/api/listings?limit=20&sort=-createdAt')
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
      const response = await axios.get('http://localhost:5000/api/listings/categories/stats')
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
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      count: categoryCounts.books
    },
    {
      id: 'electronics',
      name: 'Electronics',
      icon: Laptop,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      count: categoryCounts.electronics
    },
    {
      id: 'tools',
      name: 'Tools',
      icon: Wrench,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500',
      count: categoryCounts.tools
    },
    {
      id: 'lab-kits',
      name: 'Lab Kits',
      icon: FlaskConical,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-500',
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
    // Handle the actual backend data structure
    if (listing.pricing?.dailyRate) {
      return `₹${listing.pricing.dailyRate}/day`
    }
    // Handle the interface structure (fallback)
    if (listing.pricing?.amount) {
      const { pricing } = listing
      if (pricing.type === 'share') return 'Share'
      if (pricing.type === 'sell') return `₹${pricing.amount}`
      return `₹${pricing.amount}/${pricing.duration || 'day'}`
    }
    // Default fallback
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-green-900">
          <div className="absolute inset-0 bg-black/20"></div>
          {/* Floating Shapes */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-5xl md:text-7xl font-bold text-white mb-8"
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                Share
              </span>
              <span className="text-white">Space</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-gray-200 mb-12"
            >
              Connect with your campus community to share, rent, and exchange items safely. 
              From textbooks to tech gear, find what you need or earn by sharing what you have.
            </motion.p>

              {/* Glassy Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mx-auto max-w-2xl mb-12"
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-2">
                    <div className="relative">
                      <Search className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-white/70" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Find items, books, or kits..."
                        className="w-full rounded-xl bg-transparent py-5 pl-16 pr-32 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 text-lg"
                      />
                      <button
                        onClick={handleSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 text-sm font-medium text-white transition-all hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>            {/* Trust Indicators with Glass Effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/80"
            >
              <div className="flex items-center space-x-2 backdrop-blur-md bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                <Shield className="h-5 w-5 text-green-400" />
                <span>College Verified</span>
              </div>
              <div className="flex items-center space-x-2 backdrop-blur-md bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>4.9 Rating</span>
              </div>
              <div className="flex items-center space-x-2 backdrop-blur-md bg-white/10 px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                <Users className="h-5 w-5 text-blue-400" />
                <span>2500+ Students</span>
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
      <section className="relative py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
              Browse by Category
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Find exactly what you need from our organized categories
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
                whileHover={{ y: -10, scale: 1.05 }}
                className="group cursor-pointer"
              >
                <Link to={`/listings?category=${category.id}`}>
                  <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/20 dark:bg-white/10 border border-white/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:bg-white/30 dark:group-hover:bg-white/20">
                    {/* Gradient Background on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      <div className={`w-20 h-20 rounded-2xl ${category.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                        <category.icon className="h-10 w-10 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {category.name}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {category.count} items available
                      </p>
                      
                      <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                        <span>Explore</span>
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
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
      <section className="relative py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-slate-800">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-between mb-16"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                Featured Items
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                All available items for rent or swap from our community
              </p>
            </div>
            <Link
              to="/listings"
              className="hidden sm:flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-900/30 px-6 py-3 rounded-full transition-all duration-300 hover:scale-105"
            >
              <span>View all</span>
              <ArrowRight className="h-5 w-5" />
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
                  <div className="overflow-hidden rounded-3xl backdrop-blur-xl bg-white/30 dark:bg-white/10 border border-white/20 shadow-xl">
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 animate-pulse"></div>
                    <div className="p-6">
                      <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-lg w-3/4 mb-3 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-lg w-1/2 mb-4 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-lg w-1/4 animate-pulse"></div>
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
                      <div className="overflow-hidden rounded-3xl backdrop-blur-xl bg-white/40 dark:bg-white/10 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:bg-white/60 dark:group-hover:bg-white/20">
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
                            <div className="hidden flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-gray-400 dark:text-gray-500">
                              <CategoryIcon className="h-12 w-12" />
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="absolute top-4 right-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md border ${
                              listing.availability.status === 'available' 
                                ? 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30'
                                : 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30'
                            }`}>
                              {getAvailabilityStatus(listing)}
                            </span>
                          </div>

                          {/* Gradient Overlay */}
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
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16"
              >
                <div className="backdrop-blur-xl bg-white/20 dark:bg-white/10 border border-white/20 rounded-3xl p-12">
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
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Trusted by Students Everywhere
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-green-900">
          <div className="absolute inset-0 bg-black/20"></div>
          {/* Animated Orbs */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Glass Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 md:p-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Ready to Start
                <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent"> Sharing?</span>
              </h2>
              <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of students who are already saving money and building community through ShareSpace.
              </p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-6 justify-center"
              >
                <Link
                  to="/register"
                  className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-bold text-white rounded-2xl"
                >
                  <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 bg-gradient-to-br from-pink-600 via-purple-700 to-blue-400 group-hover:opacity-100"></span>
                  <span className="absolute top-0 left-0 w-full bg-gradient-to-b from-white to-transparent opacity-5 h-1/3"></span>
                  <span className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white to-transparent opacity-5"></span>
                  <span className="absolute inset-0 w-full h-full border border-white rounded-2xl opacity-10"></span>
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 to-white/5 rounded-2xl"></span>
                  <span className="relative text-lg group-hover:scale-110 transition-transform duration-300">Join Your Campus</span>
                </Link>
                
                <Link
                  to="/listings"
                  className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden font-bold text-white border-2 border-white/30 rounded-2xl backdrop-blur-md bg-white/10 hover:bg-white/20 transition-all duration-300"
                >
                  <span className="relative text-lg group-hover:scale-110 transition-transform duration-300 flex items-center">
                    Browse Items
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
              </motion.div>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="text-3xl font-bold text-white mb-2">2500+</div>
                  <div className="text-white/70">Active Students</div>
                </div>
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="text-3xl font-bold text-white mb-2">1200+</div>
                  <div className="text-white/70">Successful Swaps</div>
                </div>
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="text-3xl font-bold text-white mb-2">&lt; 2hrs</div>
                  <div className="text-white/70">Avg Response</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}