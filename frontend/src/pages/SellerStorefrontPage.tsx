import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

interface Listing {
    id: number;
    title: string;
    description: string;
    price: number;
    image_url: string;
    condition: string;
    category: string;
    seller_name?: string;
}

const defaultImage = '/images/logo1.jpg';

const SellerStorefrontPage = () => {
    const { user } = useAuth();
    const { id: sellerId } = useParams<{ id: string }>();
    const [listings, setListings] = useState<Listing[]>([]);
    const [sellerName, setSellerName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // If we have a seller ID from URL params, use that, otherwise use the logged-in user's ID
                const id = sellerId || user?.id;
                if (!id) return;
                
                // Fetch listings for the seller
                const listingsResponse = await axios.get(`/api/listings/store/${id}`);
                const fetchedListings = listingsResponse.data;
                setListings(fetchedListings);
                
                // Get the seller name
                if (fetchedListings && fetchedListings.length > 0 && fetchedListings[0].seller_name) {
                    // Get seller name from the first listing if available
                    setSellerName(fetchedListings[0].seller_name);
                } else if (id === user?.id && user?.username) {
                    // If viewing own store and no listings, use the logged-in username
                    setSellerName(user.username);
                } else {
                    // If no listings and not the current user, try to get seller info from another API
                    try {
                        // Try to get seller info from featured sellers
                        const sellersResponse = await axios.get('/api/listings/featured-sellers');
                        const seller = sellersResponse.data.find((s: any) => s.id == id);
                        
                        if (seller && seller.username) {
                            setSellerName(seller.username);
                        } else {
                            setSellerName('Seller');
                        }
                    } catch (sellerError) {
                        console.error('Error fetching seller info:', sellerError);
                        setSellerName('Seller');
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load storefront data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, sellerId]);

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">{sellerName}'s Store</h1>
                
                {listings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {listings.map((listing) => (
                            <Link 
                                key={listing.id} 
                                to={`/listing/${listing.id}`}
                                className="block bg-white rounded-lg shadow overflow-hidden transition-shadow hover:shadow-md"
                            >
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
                                    <p className="mt-1 text-gray-500 line-clamp-2">{listing.description}</p>
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
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500 text-lg">This seller doesn't have any listings yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerStorefrontPage;
