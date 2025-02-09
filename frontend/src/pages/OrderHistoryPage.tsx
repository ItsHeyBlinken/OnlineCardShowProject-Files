import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export const OrderHistoryPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`/api/orders/user/${user.id}`);
                setOrders(response.data);
            } catch (err) {
                setError('Failed to fetch order history');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user.id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
                <div className="mt-8">
                    {orders.length === 0 ? (
                        <p>No orders found.</p>
                    ) : (
                        <ul>
                            {orders.map(order => (
                                <li key={order.id} className="border-b py-4">
                                    <h2 className="text-lg font-medium">{order.title}</h2>
                                    <p>Status: {order.status}</p>
                                    <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}; 