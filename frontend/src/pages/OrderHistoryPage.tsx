import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BackToDashboardButton from '../components/common/BackToDashboardButton';

interface Order {
    id: string | number;
    title?: string;
    status: string;
    created_at?: string;
    createdAt?: string; // Alternative field name
    items?: Array<{
        title: string;
    }>;
}

const OrderHistoryPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                if (!user) return;
                
                // Try the correct endpoint first
                try {
                    const response = await axios.get('/api/orders/my-orders');
                    setOrders(response.data);
                    setLoading(false);
                } catch (primaryError) {
                    console.error('Error with primary endpoint:', primaryError);
                    
                    // Fall back to the secondary endpoint
                    try {
                        const fallbackResponse = await axios.get(`/api/orders/user/${user.id}`);
                        setOrders(fallbackResponse.data);
                    } catch (secondaryError) {
                        console.error('Error with fallback endpoint:', secondaryError);
                        
                        // In development mode, generate some mock orders if both APIs fail
                        if (process.env.NODE_ENV === 'development') {
                            console.log('Using mock orders data in development mode');
                            setOrders([
                                {
                                    id: 'demo-order-1',
                                    title: 'Mickey Mantle Rookie Card',
                                    status: 'completed',
                                    createdAt: new Date().toISOString()
                                },
                                {
                                    id: 'demo-order-2',
                                    title: 'Michael Jordan Fleer Rookie Card',
                                    status: 'pending',
                                    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                                }
                            ]);
                        } else {
                            throw secondaryError;
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch order history:', err);
                setError('Failed to fetch order history. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchOrders();
    }, [user]);

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
    
    if (error) return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <BackToDashboardButton customReturnPath="/profile" buttonText="Back to Profile" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
                <div className="mt-8">
                    {orders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <p className="text-gray-600">No orders found.</p>
                            <p className="mt-2 text-sm text-gray-500">Items you purchase will appear here.</p>
                        </div>
                    ) : (
                        <ul className="bg-white rounded-lg shadow overflow-hidden">
                            {orders.map(order => (
                                <li key={order.id} className="border-b p-6 last:border-b-0">
                                    <h2 className="text-lg font-medium">
                                        {order.title || (order.items && order.items[0]?.title) || 'Order'}
                                    </h2>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Order ID</p>
                                            <p className="font-medium">{order.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                              ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                'bg-gray-100 text-gray-800'}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Date</p>
                                            <p>{new Date(order.created_at || order.createdAt || '').toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export { OrderHistoryPage };
export default OrderHistoryPage; 