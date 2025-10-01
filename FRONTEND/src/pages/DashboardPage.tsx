// Team member type for frontend
interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  admins: string[];
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PaymentButton } from '../components/ui/PaymentButton';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface Booking {
  _id: string;
  listingId: {
    _id: string;
    title: string;
    images?: Array<{
      url: string;
      alt_text?: string;
    }>;
    category: string;
    pricing?: {
      type?: 'rent' | 'sell' | 'barter' | 'free';
      basePrice?: number;
      currency?: string;
    };
    ownerId?: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'active';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  paymentDate?: string;
  createdAt: string;
  notes?: string;
  barterItem?: string;
}

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  images?: Array<{
    url: string;
    alt_text?: string;
  }>;
  image_urls?: string[];
  pricing?: {
    type?: 'rent' | 'sell' | 'barter' | 'free';
    basePrice?: number;
    currency?: string;
  };
  availability?: {
    status: string;
  };
  location?: {
    pickup?: string;
  };
  isActive: boolean;
  createdAt: string;
  views?: number;
}

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalEarnings: number;
  pendingBookings: number;
}

const DashboardPage: React.FC = () => {
  // Team section state
  const [, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState(false);
  const [listingsTab, setListingsTab] = useState<'history' | 'all'>('history');
  // Add workspace state to control which dashboard to show
  const [workspace] = useState<'marketplace' | 'team'>('marketplace');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'listings'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'rented'>('all');
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    pendingBookings: 0
  });
  const [userEarnings, setUserEarnings] = useState<number>(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    // Fetch teams for user when switching to team workspace
    if (workspace === 'team') {
      fetchTeams();
    }
  }, [workspace]);

  // Fetch teams for the current user
  const fetchTeams = async () => {
    setTeamLoading(true);
    setTeamError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/teams/my', {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      if (response.data.success) {
        // Populate members with role info
        const teamsData = response.data.teams.map((team: any) => ({
          ...team,
          members: team.members.map((member: any) => ({
            ...member,
            role: team.admins.some((admin: any) => admin._id === member._id) ? 'admin' : 'member',
          })),
        }));
        setTeams(teamsData);
        setSelectedTeam(teamsData[0] || null);
      } else {
        setTeamError('Failed to fetch teams');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('sharespace_token')
        navigate('/login')
        return
      }
      setTeamError(err.response?.data?.message || 'Failed to fetch teams');
    } finally {
      setTeamLoading(false);
    }
  };

  // Remove member (admin only)
  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/teams/${teamId}/remove-member`, {
        memberId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      
      if (response.data.success) {
        alert('Member removed successfully');
        setMemberToRemove(null);
        fetchTeams();
      } else {
        alert(response.data.error || 'Failed to remove member');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  // Delete team (admin only)
  const handleDeleteTeam = async (teamId: string) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      
      if (response.data.success) {
        alert('Team deleted successfully');
        setConfirmDeleteTeam(false);
        setSelectedTeam(null);
        fetchTeams();
      } else {
        alert(response.data.error || 'Failed to delete team');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete team');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load user earnings
    refreshUserData();
    
    if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'listings') {
      fetchReceivedBookings();
      fetchListings();
    }
  }, [user, navigate, activeTab, bookingFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:5000/api/bookings/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      if (response && response.data.success) {
        const bookingsData = response.data.data || [];
        setBookings(bookingsData);
        calculateStats(bookingsData);
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings received for user's listings
  const fetchReceivedBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:5000/api/bookings/received`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      if (response && response.data.success) {
        const bookingsData = response.data.data || [];
        setBookings(bookingsData);
      } else {
        setError('Failed to fetch received bookings');
      }
    } catch (err: any) {
      console.error('Error fetching received bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch received bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch only the current user's listings
      const response = await axios.get(`http://localhost:5000/api/listings/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      if (response.data.success) {
        const listingsData = response.data.data || [];
        setListings(listingsData);
      } else {
        setError(response.data.message || 'Failed to fetch listings');
      }
    } catch (err: any) {
      console.error('Error fetching listings:', err);
      setError(err.response?.data?.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
        }
      );

      if (response.data.success) {
        // Refresh bookings to show updated status
        fetchBookings();
        
        // Show success message
        alert(`Booking ${status} successfully!`);
      } else {
        alert(response.data.message || 'Failed to update booking status');
      }
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      alert(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
      });
      
      if (response.data.success) {
        // Update user earnings from profile
        const userTotalEarnings = response.data.user.totalEarnings || 0;
        setUserEarnings(userTotalEarnings);
        console.log('User earnings updated:', userTotalEarnings);
      }
    } catch (err: any) {
      console.error('Error refreshing user data:', err);
      // Don't show error to user as this is not critical
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
    const activeBookings = bookingsData.filter(b => b.status === 'confirmed' || b.status === 'active').length;
    const completedBookings = bookingsData.filter(b => b.status === 'completed').length;
    const pendingBookings = bookingsData.filter(b => b.status === 'pending').length;
    const totalEarnings = bookingsData
      .filter(b => b.status === 'completed' || b.status === 'active')
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
        return 'bg-yellow-100 text-yellow-800 dark:text-black';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:text-black';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Main Content with Transition */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {workspace === 'marketplace' && (
          <div className="transition-all duration-500 ease-in-out">
            {/* ...existing marketplace dashboard content... */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome back, {user.name}!</p>
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
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalBookings}</p>
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
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Bookings</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeBookings}</p>
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
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingBookings}</p>
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
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{userEarnings.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Main Tabs */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'bookings'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      My Bookings
                    </button>
                    <button
                      onClick={() => setActiveTab('listings')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'listings'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      My Listings
                    </button>
                  </nav>
                </div>
              </div>

              {/* Bookings Tab Content */}
              {activeTab === 'bookings' && (
                <>
                  {/* Booking Filter Tabs */}
                  <div className="mb-6">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8">
                        <button
                          onClick={() => setBookingFilter('all')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            bookingFilter === 'all'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          All Bookings
                        </button>
                        <button
                          onClick={() => setBookingFilter('rented')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            bookingFilter === 'rented'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          My Rentals
                        </button>
                      </nav>
                    </div>
                  </div>

                  {/* Bookings List */}
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      <span className="dark:text-gray-100">
                        {bookingFilter === 'all' && 'All Bookings'}
                        {bookingFilter === 'rented' && "Items I've Rented"}
                      </span>
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
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No bookings found</h3>
                        <p className="text-gray-600 mb-4">
                          <span className="dark:text-gray-300">
                            {bookingFilter === 'rented' && "You haven't rented any items yet."}
                            {bookingFilter === 'all' && "You don't have any bookings yet."}
                          </span>
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
                                  src={(() => {
                                    const imageUrl = booking.listingId.images && booking.listingId.images[0]?.url;
                                    // Check if URL is valid and not a base64 data URL without proper content
                                    if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('data:;base64,=')) {
                                      return imageUrl;
                                    }
                                    return 'https://via.placeholder.com/80x80/e5e7eb/6b7280?text=No+Image';
                                  })()}
                                  alt={booking.listingId.title}
                                  className="w-16 h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/80x80/e5e7eb/6b7280?text=Error';
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="text-lg font-medium text-gray-900">
                                      <span className="dark:text-gray-100">{booking.listingId.title}</span>
                                    </h3>
                                    {/* Role indicator */}
                                    {booking.userId._id === user?.id ? (
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        You're Renting
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                        Your Item
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Category: {booking.listingId.category}
                                  </p>
                                  {/* Show dates for rent, else show type info */}
                                  {booking.listingId.pricing?.type === 'rent' ? (
                                    <p className="text-sm text-gray-600">
                                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                    </p>
                                  ) : booking.listingId.pricing?.type === 'sell' ? (
                                    <p className="text-sm text-gray-600">Type: Buy</p>
                                  ) : booking.listingId.pricing?.type === 'barter' ? (
                                    <p className="text-sm text-gray-600">Type: Barter{booking.barterItem ? ` | Offer: ${booking.barterItem}` : ''}</p>
                                  ) : booking.listingId.pricing?.type === 'free' ? (
                                    <p className="text-sm text-gray-600">Type: Free</p>
                                  ) : null}
                                  <p className="text-sm text-gray-600">
                                    {booking.userId._id === user?.id ? (
                                      `Your rental from this owner`
                                    ) : (
                                      `Renter: ${booking.userId.name}`
                                    )}
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
                                  <span className="dark:text-gray-100">{formatPrice(booking.totalAmount, booking.listingId.pricing?.currency || 'USD')}</span>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                  <span className={booking.status === 'confirmed' ? 'dark:text-black font-bold' : 'dark:text-gray-100'}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="dark:text-gray-400">Booked {formatDate(booking.createdAt)}</span>
                                </div>
                                
                                {/* Accept/Reject buttons for pending bookings on received tab, for ALL pricing types */}
                                {/* Accept/Reject buttons for pending bookings removed since 'listed' filter is gone */}

                                {/* Pay Now button for confirmed bookings when current user is the renter */}
                                {booking.status === 'confirmed' && 
                                 booking.userId._id === user?.id &&
                                 (!booking.paymentStatus || booking.paymentStatus === 'pending') && (
                                  <div className="mt-2">
                                    <PaymentButton
                                      bookingId={booking._id}
                                      amount={booking.totalAmount}
                                      currency={booking.listingId.pricing?.currency || 'INR'}
                                      description={`Payment for ${booking.listingId.title}`}
                                      userInfo={{
                                        name: user?.name || '',
                                        email: user?.email || ''
                                      }}
                                      onSuccess={(_response) => {
                                        alert('Payment successful!');
                                        fetchBookings(); // Refresh bookings
                                        refreshUserData(); // Refresh user earnings
                                        // Also refresh after a short delay to ensure backend has updated
                                        setTimeout(() => {
                                          refreshUserData();
                                        }, 1000);
                                      }}
                                      onFailure={(error) => {
                                        alert(`Payment failed: ${error.message}`);
                                      }}
                                      className="text-xs px-3 py-1"
                                    />
                                  </div>
                                )}

                                {/* Payment status indicator */}
                                {booking.paymentStatus === 'paid' && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <span className="dark:text-green-300">✓ Paid</span>
                                    </span>
                                    {booking.paymentDate && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        <span className="dark:text-gray-400">Paid on {formatDate(booking.paymentDate)}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </>
              )}

              {/* Listings Tab Content */}
              {activeTab === 'listings' && (
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Listings</h2>
                    <Button onClick={() => navigate('/create-listing')} variant="default">
                      Create New Listing
                    </Button>
                  </div>

                  {/* Horizontal category tabs for My Listings */}
                  <div className="mb-6">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8">
                        <button
                          onClick={() => setListingsTab('history')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            listingsTab === 'history'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Listed History
                        </button>
                        <button
                          onClick={() => setListingsTab('all')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            listingsTab === 'all'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          All My Listings
                        </button>
                      </nav>
                    </div>
                  </div>

                  {/* Category content */}
                  {listingsTab === 'history' && (
                    <>
                      {/* Pending bookings with confirmation for ALL types */}
                      <div className="space-y-4 mb-8">
                        {bookings.filter(b => b.listingId && b.listingId.ownerId === user.id && b.status === 'pending').length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-6xl mb-4">📋</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending bookings for your listings.</h3>
                            <p className="text-gray-600 mb-4">Items booked, given for free, exchanged, or bought will appear here.</p>
                          </div>
                        ) : (
                          bookings.filter(b => b.listingId && b.listingId.ownerId === user.id && b.status === 'pending').map((booking) => (
                            <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                {/* ...existing code for booking card... */}
                                <div className="flex items-start space-x-4">
                                  {/* ...existing code for image and details... */}
                                  <img
                                    src={(() => {
                                      const imageUrl = booking.listingId.images && booking.listingId.images[0]?.url;
                                      if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('data:;base64,=')) {
                                        return imageUrl;
                                      }
                                      return 'https://via.placeholder.com/80x80/e5e7eb/6b7280?text=No+Image';
                                    })()}
                                    alt={booking.listingId.title}
                                    className="w-16 h-16 object-cover rounded-lg"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'https://via.placeholder.com/80x80/e5e7eb/6b7280?text=Error';
                                    }}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h3 className="text-lg font-medium text-gray-900">
                                        {booking.listingId.title}
                                      </h3>
                                      {/* Type indicator for all types */}
                                      {booking.listingId.pricing?.type === 'rent' && (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                          <span className="dark:text-black font-bold">Booked</span>
                                        </span>
                                      )}
                                      {booking.listingId.pricing?.type === 'free' && (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                          <span className="dark:text-black font-bold">Free</span>
                                        </span>
                                      )}
                                      {booking.listingId.pricing?.type === 'barter' && (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                          <span className="dark:text-black font-bold">Exchanged</span>
                                        </span>
                                      )}
                                      {booking.listingId.pricing?.type === 'sell' && (
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-pink-100 text-pink-800 rounded-full">
                                          <span className="dark:text-black font-bold">Buy</span>
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">Category: {booking.listingId.category}</p>
                                    {/* Show dates for rent, else show type info */}
                                    {booking.listingId.pricing?.type === 'rent' ? (
                                      <p className="text-sm text-gray-600">
                                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                      </p>
                                    ) : booking.listingId.pricing?.type === 'sell' ? (
                                      <p className="text-sm text-gray-600">Type: Buy</p>
                                    ) : booking.listingId.pricing?.type === 'barter' ? (
                                      <p className="text-sm text-gray-600">Type: Barter{booking.barterItem ? ` | Offer: ${booking.barterItem}` : ''}</p>
                                    ) : booking.listingId.pricing?.type === 'free' ? (
                                      <p className="text-sm text-gray-600">Type: Free</p>
                                    ) : null}
                                    <p className="text-sm text-gray-600">
                                      Booked by: {booking.userId.name}
                                    </p>
                                    {booking.notes && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        Note: {booking.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right min-w-[160px]">
                                  <div className="text-lg font-bold text-gray-900">
                                    {formatPrice(booking.totalAmount, booking.listingId.pricing?.currency || 'USD')}
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                    <span className="dark:text-black font-bold">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Booked {formatDate(booking.createdAt)}
                                  </div>
                                  {/* Payment status indicator */}
                                  {booking.paymentStatus === 'paid' && (
                                    <div className="mt-2">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <span className="dark:text-black font-bold">✓ Paid</span>
                                      </span>
                                      {booking.paymentDate && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Paid on {formatDate(booking.paymentDate)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {/* User Confirmation for pending bookings for ALL types */}
                                  <div className="mt-3">
                                    <div className="font-semibold text-sm text-gray-700 mb-1">User Confirmation</div>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                                      >
                                        Accept
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Listed History section - show all items listed by the seller */}
                      <div className="mt-10">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-6">Listed History</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {listings.length === 0 ? (
                            <div className="text-center py-8 col-span-3">
                              <div className="text-gray-400 text-6xl mb-4">�</div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
                              <p className="text-gray-600 mb-4">You haven't created any listings yet.</p>
                              <Button onClick={() => navigate('/create-listing')} variant="default">
                                Create Your First Listing
                              </Button>
                            </div>
                          ) : (
                            listings.map((listing) => (
                              <div key={listing._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                <img
                                  src={(() => {
                                    const imageUrl = (listing.images && listing.images[0]?.url) || (listing.image_urls && listing.image_urls[0]);
                                    if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('data:;base64,=')) {
                                      return imageUrl;
                                    }
                                    return 'https://via.placeholder.com/300x200/e5e7eb/6b7280?text=No+Image';
                                  })()}
                                  alt={listing.title}
                                  className="w-full h-48 object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/300x200/e5e7eb/6b7280?text=Error';
                                  }}
                                />
                                <div className="p-4">
                                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{listing.title}</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Category: {listing.category}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Condition: {listing.condition}</p>
                                  {listing.pricing && (
                                    <p className="text-lg font-bold text-gray-900 mb-2">
                                      <span className="dark:text-gray-100">₹{listing.pricing.basePrice}{listing.pricing.type === 'rent' ? '/day' : ''}</span>
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      listing.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {listing.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <Button 
                                      onClick={() => navigate(`/listing/${listing._id}`)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                  {/* Management buttons for each listing */}
                                  <div className="flex flex-col gap-2 mt-2">
                                    <Button
                                      onClick={() => navigate(`/edit-listing/${listing._id}`)}
                                      variant="default"
                                      size="sm"
                                    >
                                      Update
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setListingToDelete(listing._id);
                                        setConfirmOpen(true);
                                      }}
                                      variant="destructive"
                                      size="sm"
                                    >
                                      Delete
                                    </Button>
                                    <Button
                                      onClick={async () => {
                                        try {
                                          const newStatus = listing.isActive ? false : true;
                                          await axios.put(`http://localhost:5000/api/listings/${listing._id}/status`, { isActive: newStatus }, {
                                            headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
                                          });
                                          alert(`Listing is now ${newStatus ? 'Public' : 'Private'}.`);
                                          window.location.reload();
                                        } catch (err) {
                                          alert('Error updating listing status.');
                                        }
                                      }}
                                      variant={listing.isActive ? 'secondary' : 'default'}
                                      size="sm"
                                    >
                                      {listing.isActive ? 'Make Private' : 'Make Public'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {listingsTab === 'all' && (
                    <div className="mt-10">
                      <h3 className="text-lg font-semibold text-gray-700 mb-6">All My Listings</h3>
                      {loading && (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading listings...</p>
                        </div>
                      )}
                      {error && (
                        <div className="text-center py-8">
                          <div className="text-red-500 text-xl mb-2">⚠️</div>
                          <p className="text-red-600">{error}</p>
                          <Button onClick={fetchListings} variant="outline" className="mt-4">
                            Try Again
                          </Button>
                        </div>
                      )}
                      {!loading && !error && listings.length === 0 && (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-6xl mb-4">📝</div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No listings found</h3>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">You haven't created any listings yet.</p>
                          <Button onClick={() => navigate('/create-listing')} variant="default">
                            Create Your First Listing
                          </Button>
                        </div>
                      )}
                      {!loading && !error && listings.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {listings.map((listing) => (
                            <div key={listing._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                              <img
                                src={(() => {
                                  const imageUrl = (listing.images && listing.images[0]?.url) || (listing.image_urls && listing.image_urls[0]);
                                  if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('data:;base64,=')) {
                                    return imageUrl;
                                  }
                                  return 'https://via.placeholder.com/300x200/e5e7eb/6b7280?text=No+Image';
                                })()}
                                alt={listing.title}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://via.placeholder.com/300x200/e5e7eb/6b7280?text=Error';
                                }}
                              />
                              <div className="p-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{listing.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Category: {listing.category}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Condition: {listing.condition}</p>
                                {listing.pricing && (
                                  <p className="text-lg font-bold text-gray-900 mb-2">
                                    <span className="dark:text-gray-100">₹{listing.pricing.basePrice}/day</span>
                                  </p>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    listing.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {listing.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <Button 
                                    onClick={() => navigate(`/listing/${listing._id}`)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}
        {workspace === 'team' && (
          <div className="transition-all duration-500 ease-in-out">
            <div className="max-w-4xl mx-auto px-4 py-8">
              <h2 className="text-3xl font-bold text-blue-600 mb-4">Team Workspace</h2>
              {teamLoading ? (
                <div className="text-center py-8">Loading teams...</div>
              ) : teamError ? (
                <div className="text-center py-8 text-red-600">{teamError}</div>
              ) : selectedTeam ? (
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedTeam.name}</h3>
                      <p className="text-gray-600 mb-2">{selectedTeam.description}</p>
                    </div>
                    {(selectedTeam.admins.includes(user?.id) || selectedTeam.admins.includes((user as any)?._id)) && (
                      <Button variant="outline" onClick={() => setShowTeamSettings(!showTeamSettings)}>
                        ⚙️ Settings
                      </Button>
                    )}
                  </div>
                  {/* Team Members Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded-lg">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border-b">Name</th>
                          <th className="px-4 py-2 border-b">Email</th>
                          <th className="px-4 py-2 border-b">Role</th>
                          {(selectedTeam.admins.includes(user?.id) || selectedTeam.admins.includes((user as any)?._id)) && <th className="px-4 py-2 border-b">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTeam.members.map((member) => (
                          <tr key={member._id}>
                            <td className="px-4 py-2 border-b">{member.name}</td>
                            <td className="px-4 py-2 border-b">{member.email}</td>
                            <td className="px-4 py-2 border-b">{member.role === 'admin' ? <span className="text-blue-600 font-semibold">Admin</span> : 'Member'}</td>
                            {(selectedTeam.admins.includes(user?.id) || selectedTeam.admins.includes((user as any)?._id)) && (
                              <td className="px-4 py-2 border-b">
                                {member.role !== 'admin' && (
                                  <Button variant="destructive" size="sm" onClick={() => setMemberToRemove(member)}>
                                    Remove
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Team Settings for Admin */}
                  {showTeamSettings && (selectedTeam.admins.includes(user?.id) || selectedTeam.admins.includes((user as any)?._id)) && (
                    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-bold mb-2">Admin Actions</h4>
                      <Button variant="destructive" onClick={() => setConfirmDeleteTeam(true)}>
                        Delete Group
                      </Button>
                    </div>
                  )}
                </Card>
              ) : (
                <div className="text-center py-8">No team found.</div>
              )}
              {/* Confirm Remove Member Dialog */}
              {memberToRemove && (
                <ConfirmDialog
                  open={!!memberToRemove}
                  message={`Remove ${memberToRemove.name} from the team?`}
                  onConfirm={() => handleRemoveMember(selectedTeam!._id, memberToRemove._id)}
                  onCancel={() => setMemberToRemove(null)}
                />
              )}
              {/* Confirm Delete Team Dialog */}
              {confirmDeleteTeam && (
                <ConfirmDialog
                  open={confirmDeleteTeam}
                  message={`Are you sure you want to delete the group "${selectedTeam?.name}"? This cannot be undone.`}
                  onConfirm={() => handleDeleteTeam(selectedTeam!._id)}
                  onCancel={() => setConfirmDeleteTeam(false)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        message="Are you sure you want to delete this listing?"
        onConfirm={async () => {
          if (listingToDelete) {
            try {
              await axios.delete(`http://localhost:5000/api/listings/${listingToDelete}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('sharespace_token')}` }
              });
              setConfirmOpen(false);
              setListingToDelete(null);
              window.location.reload();
            } catch (err) {
              setConfirmOpen(false);
              setListingToDelete(null);
            }
          }
        }}
        onCancel={() => {
          setConfirmOpen(false);
          setListingToDelete(null);
        }}
      />
    </>
  );
};

export default DashboardPage;