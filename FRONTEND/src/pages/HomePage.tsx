import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
      const categories = ['books', 'electronics', 'tools', 'lab-kits']
      const counts: { [key: string]: number } = {}
      
      for (const category of categories) {
        try {
          const response = await axios.get(`http://localhost:5000/api/listings?category=${category}&limit=1`)
          if (response.data.success) {
            counts[category] = response.data.pagination?.total || 0
          }
        } catch (error) {
          counts[category] = 0
        }
      }
      
      setCategoryCounts({
        books: counts.books || 0,
        electronics: counts.electronics || 0,
        tools: counts.tools || 0,
        'lab-kits': counts['lab-kits'] || 0
      })
    } catch (error) {
      console.error('Error fetching category counts:', error)
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
    const { pricing } = listing
    if (pricing.type === 'share') return 'Share'
    if (pricing.type === 'sell') return `₹${pricing.amount}`
    return `₹${pricing.amount}/${pricing.duration || 'day'}`
  }

  const getAvailabilityStatus = (listing: Listing) => {
    return listing.availability.status === 'available' ? 'Available' : 'Unavailable'
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
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl"
            >
              Swap, Rent, & Borrow.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Campus-wide.
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300"
            >
              Connect with your campus community to share, rent, and exchange items safely. 
              From textbooks to tech gear, find what you need or earn by sharing what you have.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mx-auto mt-10 max-w-xl"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find items, books, or kits..."
                  className="w-full rounded-xl border-0 bg-white/80 backdrop-blur-sm py-4 pl-12 pr-20 text-gray-900 shadow-lg ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800/80 dark:text-white dark:ring-gray-700 dark:placeholder:text-gray-500"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 px-6 py-2 text-sm font-medium text-white transition-all hover:from-blue-600 hover:to-green-600 hover:scale-105">
                  Search
                </button>
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mx-auto mt-8 flex max-w-md items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400"
            >
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4 text-green-500" />
                <span>College Verified</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>4.9 Rating</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Categories */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Browse by Category
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Find exactly what you need from our organized categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer"
              >
                <Link to={`/listings?category=${category.id}`}>
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-soft hover:shadow-medium transition-all duration-300 dark:from-gray-800 dark:to-gray-700">
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-xl ${category.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <category.icon className="h-8 w-8 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {category.name}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {category.count} items available
                      </p>
                      
                      <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                        <span>Explore</span>
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
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
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Items Listed
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                All available items for rent or swap from our community
              </p>
            </div>
            <Link
              to="/listings"
              className="hidden sm:flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="overflow-hidden rounded-2xl bg-white shadow-soft dark:bg-gray-700">
                    <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-600"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : listings.length > 0 ? (
              listings.map((listing, index) => {
                const CategoryIcon = getCategoryIcon(listing.category)
                return (
                  <motion.div
                    key={listing._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <Link to={`/listing/${listing._id}`}>
                      <div className="overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-medium transition-all duration-300 dark:bg-gray-700">
                        <div className="relative">
                          <div className="aspect-[4/3]">
                            {listing.images && listing.images.length > 0 ? (
                              <img
                                src={listing.images[0].url}
                                alt={listing.images[0].alt_text || listing.title}
                                className="w-full h-full object-cover"
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
                          <div className="absolute top-3 right-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              listing.availability.status === 'available' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            }`}>
                              {getAvailabilityStatus(listing)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                {listing.title}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
                                {listing.category.replace('-', ' ')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {listing.ownerId?.reputation?.score?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({listing.ownerId?.reputation?.ratingsCount || 0})
                              </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatPrice(listing)}
                            </span>
                          </div>
                          
                          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            Listed by {listing.ownerId?.name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No listings available at the moment.</p>
              </div>
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
      <section className="py-16 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Swapping?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already saving money and building community through CampusSwap.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Join Your Campus
              </Link>
              <Link
                to="/browse"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Browse Items
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}