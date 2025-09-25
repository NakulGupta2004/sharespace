import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { uploadImageToCloudinary } from '../utils/cloudinaryService'
import { 
  Upload, 
  X, 
  Package, 
  DollarSign, 
  MapPin,
  Tag,
  ImageIcon,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react'
import { Button } from '../components/ui/Button'

interface FormData {
  title: string
  description: string
  category: string
  subcategory: string
  condition: string
  pricingType: string
  hourlyRate: string
  dailyRate: string
  sellPrice: string
  depositAmount: string
  location: string
  tags: string[]
  imageUrls: string[]
  price: string
  isPublic: boolean
}

interface FormErrors {
  [key: string]: string
}

const CATEGORIES = [
  { value: 'books', label: 'Books' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'tools', label: 'Tools' },
  { value: 'lab-kits', label: 'Lab Kits' },
  { value: 'sports', label: 'Sports Equipment' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' }
]

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
]

const PRICING_TYPES = [
  { value: 'rent', label: 'Rent' },
  { value: 'sell', label: 'Sell' },
  { value: 'free', label: 'Free' },
  { value: 'barter', label: 'Barter' }
]

export default function CreateListingPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    condition: '',
    pricingType: '',
    hourlyRate: '',
    dailyRate: '',
    sellPrice: '',
    depositAmount: '',
    location: 'On campus',
    tags: [],
    imageUrls: [],
    price: '',
    isPublic: true
  })
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size > 0 && file.size <= 5 * 1024 * 1024 // 5MB, not empty
      return isValidType && isValidSize
    })
    if (files.length === 0) {
      setErrors(prev => ({ ...prev, images: 'No file selected.' }))
      return
    }
    if (validFiles.length !== files.length) {
      setErrors(prev => ({
        ...prev,
        images: 'Some files were rejected. Only non-empty image files under 5MB are allowed.'
      }))
    }
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)) // Max 5 images
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const addImageUrl = () => {
    if (currentImageUrl.trim() && isValidUrl(currentImageUrl)) {
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, currentImageUrl.trim()].slice(0, 5)
      }))
      setCurrentImageUrl('')
      if (errors.images) {
        setErrors(prev => ({ ...prev, images: '' }))
      }
    } else {
      setErrors(prev => ({ ...prev, imageUrl: 'Please enter a valid image URL' }))
    }
  }

  const removeImageUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
    } catch {
      return false
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.condition) newErrors.condition = 'Condition is required'
    if (!formData.pricingType) newErrors.pricingType = 'Pricing type is required'

    // Validate pricing fields based on type
    if (formData.pricingType === 'rent') {
      if (!formData.hourlyRate && !formData.dailyRate) {
        newErrors.pricing = 'At least one rate (hourly or daily) is required for rentals'
      }
      if (formData.hourlyRate && parseFloat(formData.hourlyRate) < 0) {
        newErrors.hourlyRate = 'Rate cannot be negative'
      }
      if (formData.dailyRate && parseFloat(formData.dailyRate) < 0) {
        newErrors.dailyRate = 'Rate cannot be negative'
      }
    }

    if (formData.pricingType === 'sell') {
      if (!formData.sellPrice) {
        newErrors.sellPrice = 'Sell price is required'
      } else if (parseFloat(formData.sellPrice) < 0) {
        newErrors.sellPrice = 'Price cannot be negative'
      }
    }

    // Validate images
    if (selectedFiles.length === 0 && formData.imageUrls.length === 0) {
      newErrors.images = 'At least one image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})
  setSubmitStatus('idle')
    try {
      let imageUrls: string[] = [...formData.imageUrls]
      // If files are selected, upload them to Cloudinary
      if (selectedFiles.length > 0) {
        // Only upload valid files
        const validFiles = selectedFiles.filter(file => file.size > 0 && file.type.startsWith('image/'))
        if (validFiles.length === 0) {
          throw new Error('No valid image files to upload.')
        }
        const uploadPromises = validFiles.map(file => uploadImageToCloudinary(file))
        const cloudinaryUrls = await Promise.all(uploadPromises)
        imageUrls = imageUrls.concat(cloudinaryUrls)
      }

      // Prepare pricing object for backend
      const pricing = {
        type: formData.pricingType,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
        sellPrice: formData.sellPrice ? parseFloat(formData.sellPrice) : undefined,
        depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : 0
      };

      // Prepare payload for backend
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        condition: formData.condition,
        pricing,
        location: {
          type: 'campus',
          details: formData.location
        },
        availability: {
          isAvailable: true,
          availableFrom: new Date().toISOString(),
          availableUntil: null
        },
        tags: formData.tags,
        image_urls: imageUrls
      }

      const response = await axios.post('/api/listings', payload)
      const data = response.data

      if (data.success) {
        setSubmitStatus('success')
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } else {
        throw new Error(data.message || 'Failed to create listing')
      }
    } catch (error: any) {
      console.error('Error creating listing:', error)
      setSubmitStatus('error')
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create listing'
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalImages = selectedFiles.length + formData.imageUrls.length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create New Listing
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Share your items with the ShareSpace community
            </p>
          </div>

          {submitStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
            >
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-green-800 dark:text-green-200">
                Listing created successfully! Redirecting to dashboard...
              </span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <Package className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Basic Information
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., MacBook Pro 2021"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    maxLength={100}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    placeholder="e.g., Laptop, Textbook"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Condition *
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.condition ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select condition</option>
                    {CONDITIONS.map(condition => (
                      <option key={condition.value} value={condition.value}>{condition.label}</option>
                    ))}
                  </select>
                  {errors.condition && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.condition}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe your item in detail..."
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  maxLength={1000}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formData.description.length}/1000 characters
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Pricing
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pricing Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRICING_TYPES.map(type => (
                    <label
                      key={type.value}
                      className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.pricingType === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pricingType"
                        value={type.value}
                        checked={formData.pricingType === type.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.pricingType && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.pricingType}</p>
                )}
              </div>

              {formData.pricingType === 'rent' && (
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hourly Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    {errors.hourlyRate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.hourlyRate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Daily Rate (₹)
                    </label>
                    <input
                      type="number"
                      name="dailyRate"
                      value={formData.dailyRate}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    {errors.dailyRate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dailyRate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      name="depositAmount"
                      value={formData.depositAmount}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              )}

              {formData.pricingType === 'sell' && (
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sell Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="sellPrice"
                    value={formData.sellPrice}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.sellPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.sellPrice && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sellPrice}</p>
                  )}
                </div>
              )}

              {errors.pricing && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.pricing}</p>
              )}
            </div>

            {/* Images */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Images ({totalImages}/5)
                </h2>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Images
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload images or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Max 5 images, 5MB each (JPG, PNG, GIF, WebP)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selected Files
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image URLs */}
              {selectedFiles.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or Add Image URLs
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={currentImageUrl}
                      onChange={(e) => setCurrentImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <Button
                      type="button"
                      onClick={addImageUrl}
                      disabled={!currentImageUrl.trim() || formData.imageUrls.length >= 5}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  {errors.imageUrl && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.imageUrl}</p>
                  )}
                </div>
              )}

              {/* Image URLs List */}
              {formData.imageUrls.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URLs
                  </h3>
                  <div className="space-y-2">
                    {formData.imageUrls.map((url, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="flex-1 text-sm text-gray-600 dark:text-gray-300 truncate">
                          {url}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImageUrl(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.images && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.images}</p>
              )}
            </div>

            {/* Additional Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <MapPin className="h-5 w-5 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Additional Details
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Main Library, Hostel Block A"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={!currentTag.trim()}
                    variant="outline"
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            {errors.submit && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-red-800 dark:text-red-200">{errors.submit}</span>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="gradient"
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Listing'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}