import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

// Helper function to ensure price is a number before formatting
const formatPrice = (price: any): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

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

interface SellerProfile {
    business_name?: string;
    description?: string;
    image_url?: string;
    offers_free_shipping: boolean;
    standard_shipping_fee: number;
    shipping_policy?: string;
    uses_calculated_shipping: boolean;
}

const defaultImage = '/images/logo1.jpg';

const SellerStorefrontPage = () => {
    const { user } = useAuth();
    const { id: sellerId } = useParams<{ id: string }>();
    const [listings, setListings] = useState<Listing[]>([]);
    const [sellerName, setSellerName] = useState<string>('');
    const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
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
                
                // Fetch seller's shipping policy
                try {
                    const shippingResponse = await axios.get(`/api/shipping/policy/${id}`);
                    setSellerProfile(shippingResponse.data);
                } catch (shippingError) {
                    console.error('Error fetching shipping policy:', shippingError);
                    // Not setting an error state here since shipping policy is optional
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
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{sellerName}'s Store</h1>
                
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
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                                            {listing.category}
                                        </span>
                                        {sellerProfile?.offers_free_shipping && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Free Shipping
                                            </span>
                                        )}
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
