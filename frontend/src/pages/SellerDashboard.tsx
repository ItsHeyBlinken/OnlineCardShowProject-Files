import React, { useState, useEffect, useCallback } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const defaultImage = '/images/logo1.jpg';

interface DashboardStats {
    totalSales: number;
    activeListings: number;
    pendingOrders: number;
    monthlyRevenue: number;
    subscriptionTier?: string;
    maxListings?: number;
}

const SellerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalSales: 0,
        activeListings: 0,
        pendingOrders: 0,
        monthlyRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const history = useHistory();
    const [hasListings, setHasListings] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const getMaxListings = (tier: string) => {
        switch (tier) {
            case 'Basic': return 75;
            case 'Starter': return 250;
            case 'Pro': return 750;
            case 'Premium': return 999999; // Effectively unlimited
            default: return 75;
        }
    };

    const fetchDashboardStats = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            console.log('Making request to:', '/api/stores/dashboard'); // Updated URL
            console.log('Token:', token ? 'exists' : 'missing');
            
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Updated endpoint to match your backend
            const response = await axios.get('/api/stores/dashboard', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Also fetch listings
            const listingsResponse = await axios.get('/api/stores/dashboard/listings', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Dashboard Response:', response.data);
            console.log('Listings Response:', listingsResponse.data);

            const tier = response.data.subscriptionTier || 'Basic';
            const maxListings = getMaxListings(tier);

            setStats({
                ...response.data,
                activeListings: listingsResponse.data.length || 0,
                subscriptionTier: tier,
                maxListings
            });
            setError('');
        } catch (err: any) {
            console.error('Error details:', {
                url: err.config?.url,
                method: err.config?.method,
                status: err.response?.status,
                data: err.response?.data,
                message: err.message
            });
            setError(err.response?.data?.message || 'Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchDashboardStats();
            checkListings();
            fetchUnreadMessageCount();
            
            // Set up polling for message count updates
            const intervalId = setInterval(fetchUnreadMessageCount, 60000); // Check every minute
            
            return () => clearInterval(intervalId);
        }
    }, [user, fetchDashboardStats]);

    const checkListings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/seller/listings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasListings(response.data.length > 0);
        } catch (error) {
            console.error('Error checking listings:', error);
        }
    };

    const fetchUnreadMessageCount = async () => {
        try {
            const response = await axios.get('/api/messages/unread/count');
            setUnreadMessages(response.data.count);
        } catch (error) {
            console.error('Error fetching unread message count:', error);
        }
    };

    const handleCreateListing = () => {
        history.push('/seller/create-listing');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-600">
                    <p>Error: {error}</p>
                    <button 
                        onClick={fetchDashboardStats}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
                    <button
                        onClick={handleCreateListing}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Create Listing
                    </button>
                </div>
                {/* Header */}
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-5">
                            <div className="flex-shrink-0">
                                <img
                                    src={user?.image_url || defaultImage}
                                    alt="Seller Profile"
                                    className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                    Welcome back, {user?.username}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Manage your store and view your statistics
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {!hasListings && (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <h3 className="text-xl font-medium text-gray-900 mb-4">
                            Welcome to your Seller Dashboard!
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Get started by creating your first listing
                        </p>
                        <button
                            onClick={handleCreateListing}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Create Your First Listing
                        </button>
                    </div>
                )}

                {/* Stats Overview */}
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Sales Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    {/* Icon can be added here */}
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total Sales
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            ${(stats.totalSales || 0).toFixed(2)}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Listings Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Active Listings
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.activeListings}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Orders Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Pending Orders
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.pendingOrders}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Revenue Card */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Monthly Revenue
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            ${(stats.monthlyRevenue || 0).toFixed(2)}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Subscription Info Card */}
                <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Subscription Status
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Current Plan: <span className="font-medium">{stats.subscriptionTier}</span>
                                </p>
                                <div className="mt-2">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <div className="relative pt-1">
                                                <div className="flex mb-2 items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                                            Listing Usage
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                                            {stats.activeListings} / {stats.maxListings}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                                                    <div 
                                                        style={{ width: `${(stats.activeListings / (stats.maxListings || 1)) * 100}%` }}
                                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Link 
                                to="/seller/subscription" 
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Manage Subscription
                            </Link>
                        </div>
                    </div>
                </div>

                {/* No Listings Message */}
                {stats.activeListings === 0 && (
                    <div className="mt-8 bg-white shadow sm:rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="text-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    No Active Listings
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions - Only show if there are listings */}
                {stats.activeListings > 0 && (
                    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <Link to="/manage-listings" className="block">
                            <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-500 transition-colors">
                                <h3 className="text-lg font-medium text-gray-900">Manage Listings</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    View and edit your current listings
                                </p>
                            </div>
                        </Link>

                        <Link to="/orders" className="block">
                            <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-500 transition-colors">
                                <h3 className="text-lg font-medium text-gray-900">View Orders</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Manage your orders and shipments
                                </p>
                            </div>
                        </Link>

                        <Link to="/analytics" className="block">
                            <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-500 transition-colors">
                                <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    View your sales analytics and reports
                                </p>
                            </div>
                        </Link>

                        <Link to="/inbox" className="block">
                            <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-500 transition-colors relative">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Messages
                                    {unreadMessages > 0 && (
                                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                            {unreadMessages > 9 ? '9+' : unreadMessages}
                                        </span>
                                    )}
                                </h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    {unreadMessages > 0 
                                        ? `You have ${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}`
                                        : 'View and respond to buyer messages'}
                                </p>
                            </div>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;
