import { Link } from 'react-router-dom'
import { Github, Twitter, Mail, ShoppingCart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200/20 dark:bg-gray-900/80 dark:border-gray-700/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-blue-600">
                  ShareSpace
                </span>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                The premier platform for college students to swap, rent, and borrow items safely within campus communities. Build trust, save money, and collaborate with your peers.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Platform
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/browse" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Browse Items
                  </Link>
                </li>
                <li>
                  <Link to="/teams" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Team Spaces
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/safety" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Safety Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/help" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-gray-500 dark:text-gray-400">
              © 2024 ShareSpace. Made with ❤️ for students, by students.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}