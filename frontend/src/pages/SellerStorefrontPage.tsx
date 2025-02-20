import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

interface Listing {
    id: number;
    title: string;
    description: string;
    price: number;
    image_url: string;
    condition: string;
    category: string;
}

const defaultImage = '/images/logo1.jpg';

const SellerStorefrontPage = () => {
    const { user } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchListings = async () => {
            if (!user?.id) return;
            try {
                const response = await axios.get(`/api/listings/store/${user.id}`);
                setListings(response.data);
            } catch (error) {
                console.error('Error fetching listings:', error);
                setError('Failed to load listings');
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, [user]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">{user?.username}'s Active Listings</h1>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {listings.map((listing) => (
                        <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <img 
                                src={listing.image_url || defaultImage} 
                                alt={listing.title}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = defaultImage;
                                }}
                            />
                            <div className="p-4">
                                <h3 className="text-lg font-medium text-gray-900">{listing.title}</h3>
                                <p className="mt-1 text-gray-500">{listing.description}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-900">
                                        ${Number(listing.price).toFixed(2)}
                                    </span>
                                    <span className="text-sm text-gray-500 capitalize">
                                        {listing.condition}
                                    </span>
                                </div>
                                <div className="mt-2">
                                    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                                        {listing.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {listings.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No listings available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerStorefrontPage;
