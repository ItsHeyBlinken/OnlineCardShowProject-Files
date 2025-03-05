import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LazyImage from '../components/common/LazyImage';
import { Link } from 'react-router-dom';

// Add new interface for Seller
interface Seller {
    id: number;
    username: string;
    email: string;
    rating: number;
    image_url: string | null;
    listing_count: number;
    avg_price: number;
}

interface Listing {
    id: number;
    title: string;
    price: string;
    image_url: string | null;
    image_urls?: string[];
    seller_name: string;
    seller_id: number;
}

const defaultImage = '/images/logo1.jpg';

const HomePage: React.FC = () => {
    const [featuredSellers, setFeaturedSellers] = useState<Seller[]>([]);
    const [recentListings, setRecentListings] = useState<Listing[]>([]);
    const [deals, setDeals] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [featuredRes, recentRes, dealsRes] = await Promise.all([
                    axios.get('/api/sellers/featured'),
                    axios.get('/api/sellers/recent'),
                    axios.get('/api/sellers/deals')
                ]);

                setFeaturedSellers(featuredRes.data);
                setRecentListings(recentRes.data);
                setDeals(dealsRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load content');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper function to get image URLs from a listing, with fallback to the single image_url
    const getListingImages = (listing: Listing): string[] => {
        if (listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0) {
            return listing.image_urls;
        }
        return listing.image_url ? [listing.image_url] : [defaultImage];
    };

    const formatRating = (rating: any) => {
        if (!rating) return 'No ratings';
        const numRating = Number(rating);
        return isNaN(numRating) ? 'No ratings' : numRating.toFixed(1);
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-4 gap-6">
                    {/* Featured Sellers - Left Column */}
                    <div className="col-span-1">
                        <h2 className="text-2xl font-bold mb-6">Featured Sellers</h2>
                        <div className="space-y-6">
                            {featuredSellers.map((seller) => (
                                <div key={seller.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                                    <Link to={`/storefront/${seller.id}`}>
                                        <LazyImage 
                                            src={seller.image_url || defaultImage} 
                                            alt={seller.username}
                                            className="w-full h-48 object-cover rounded-md mb-4"
                                        />
                                        <h3 className="text-lg font-semibold">{seller.username}</h3>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center">
                                                <span className="text-yellow-400 mr-1">
                                                    ★
                                                </span>
                                                <span className="text-gray-600">
                                                    {formatRating(seller.rating)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {seller.listing_count || 0} {(seller.listing_count === 1) ? 'listing' : 'listings'}
                                            </p>
                                            {Number(seller.avg_price) > 0 && (
                                                <p className="text-sm text-gray-500">
                                                    Avg. Price: ${Number(seller.avg_price).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recently Listed - Center 2x2 Grid */}
                    <div className="col-span-2">
                        <h2 className="text-2xl font-bold mb-6">Recently Listed</h2>
                        <div className="grid grid-cols-2 gap-6">
                            {recentListings.map((item) => (
                                <div key={item.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                                    <Link to={`/listing/${item.id}`}>
                                        <LazyImage 
                                            src={getListingImages(item)[0]} 
                                            alt={item.title}
                                            className="w-full h-48 object-cover rounded-md mb-4"
                                        />
                                        <h3 className="text-lg font-semibold">{item.title}</h3>
                                        <p className="text-gray-600">${item.price}</p>
                                        <p className="text-sm text-gray-500">Seller: {item.seller_name}</p>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Deals - Right Column */}
                    <div className="col-span-1">
                        <h2 className="text-2xl font-bold mb-6">Deals & Steals</h2>
                        <div className="space-y-6">
                            {deals.map((item) => (
                                <div key={item.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                                    <Link to={`/listing/${item.id}`}>
                                        <LazyImage 
                                            src={getListingImages(item)[0]} 
                                            alt={item.title}
                                            className="w-full h-48 object-cover rounded-md mb-4"
                                        />
                                        <h3 className="text-lg font-semibold">{item.title}</h3>
                                        <p className="text-gray-600">${item.price}</p>
                                        <p className="text-sm text-gray-500">Seller: {item.seller_name}</p>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;