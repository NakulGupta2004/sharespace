import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Booking {
  _id: string;
  listingId: {
    _id: string;
    title: string;
    images: string[];
    category: string;
    pricing: {
      basePrice: number;
      currency: string;
    };
  };
  renterId: {
    _id: string;
    name: string;
    email: string;
  };
  ownerId: {
    _id: string;
    name: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  notes?: string;
}

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalEarnings: number;
  pendingBookings: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'rented' | 'listed'>('all');
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    pendingBookings: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [user, navigate, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`http://localhost:5000/api/bookings/my?type=${activeTab}`);
      
      if (response.data.success) {
        const bookingsData = response.data.bookings || [];
        setBookings(bookingsData);
        calculateStats(bookingsData);
      } else {
        setError(response.data.message || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData: Booking[]) => {
    if (!Array.isArray(bookingsData)) {
      setStats({
        totalBookings: 0,
        activeBookings: 0,
        completedBookings: 0,
        totalEarnings: 0,
        pendingBookings: 0
      });
      return;
    }

    const totalBookings = bookingsData.length;
    const activeBookings = bookingsData.filter(b => b.status === 'confirmed').length;
    const completedBookings = bookingsData.filter(b => b.status === 'completed').length;
    const pendingBookings = bookingsData.filter(b => b.status === 'pending').length;
    const totalEarnings = bookingsData
      .filter(b => b.status === 'completed' && b.ownerId._id === user?.id)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    setStats({
      totalBookings,
      activeBookings,
      completedBookings,
      totalEarnings,
      pendingBookings
    });
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalEarnings)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Bookings
              </button>
              <button
                onClick={() => setActiveTab('rented')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rented'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Rentals
              </button>
              <button
                onClick={() => setActiveTab('listed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'listed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Listings
              </button>
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {activeTab === 'all' && 'All Bookings'}
            {activeTab === 'rented' && 'Items I\'ve Rented'}
            {activeTab === 'listed' && 'Bookings for My Items'}
          </h2>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading bookings...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 text-xl mb-2">⚠️</div>
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchBookings} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'rented' && "You haven't rented any items yet."}
                {activeTab === 'listed' && "No one has booked your items yet."}
                {activeTab === 'all' && "You don't have any bookings yet."}
              </p>
              <Button onClick={() => navigate('/')} variant="default">
                Browse Items
              </Button>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <img
                        src={booking.listingId.images[0] || '/api/placeholder/80/80'}
                        alt={booking.listingId.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {booking.listingId.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Category: {booking.listingId.category}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activeTab === 'rented' ? `Owner: ${booking.ownerId.name}` : 
                           activeTab === 'listed' ? `Renter: ${booking.renterId.name}` :
                           booking.renterId._id === user.id ? `Owner: ${booking.ownerId.name}` : `Renter: ${booking.renterId.name}`}
                        </p>
                        {booking.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            Note: {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(booking.totalAmount, booking.listingId.pricing.currency)}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Booked {formatDate(booking.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;