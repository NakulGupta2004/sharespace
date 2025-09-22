import { motion } from 'framer-motion'

export default function ListingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Listing Details
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Coming soon - Detailed view of items with booking options and QR codes.
          </p>
        </motion.div>
      </div>
    </div>
  )
}