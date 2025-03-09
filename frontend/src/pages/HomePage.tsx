import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LazyImage from '../components/common/LazyImage';
import { Link } from 'react-router-dom';
import useShippingPolicies from '../hooks/useShippingPolicies';

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
    offers_free_shipping?: boolean;
}

const defaultImage = '/images/logo1.jpg';

const HomePage: React.FC = () => {
    const [featuredSellers, setFeaturedSellers] = useState<Seller[]>([]);
    const [recentListings, setRecentListings] = useState<Listing[]>([]);
    const [deals, setDeals] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sellerIds, setSellerIds] = useState<number[]>([]);
    
    // Fetch main data (listings and sellers)
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch all initial data
                const [featuredRes, recentRes, dealsRes] = await Promise.all([
                    axios.get('/api/sellers/featured'),
                    axios.get('/api/sellers/recent'),
                    axios.get('/api/sellers/deals')
                ]);

                // Set featured sellers immediately - no shipping info needed
                setFeaturedSellers(featuredRes.data);
                
                // Store the raw listings data
                const recentListingsData = recentRes.data;
                const dealsData = dealsRes.data;
                
                // Set listings without shipping data first
                setRecentListings(recentListingsData);
                setDeals(dealsData);
                
                // Collect unique seller IDs for the shipping policies hook
                const uniqueSellerIds = new Set<number>();
                [...recentListingsData, ...dealsData].forEach(item => {
                    uniqueSellerIds.add(item.seller_id);
                });
                
                // Update seller IDs for the hook
                setSellerIds(Array.from(uniqueSellerIds));
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load content');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    
    // Use the custom hook to fetch shipping policies
    const { policies, loading: loadingPolicies } = useShippingPolicies(sellerIds);
    
    // Apply shipping policies when they're loaded
    useEffect(() => {
        if (Object.keys(policies).length === 0 || loadingPolicies) return;
        
        // Update recent listings with shipping info
        setRecentListings(prev => prev.map(listing => ({
            ...listing,
            offers_free_shipping: policies[listing.seller_id]?.offers_free_shipping || false
        })));
        
        // Update deals with shipping info
        setDeals(prev => prev.map(listing => ({
            ...listing,
            offers_free_shipping: policies[listing.seller_id]?.offers_free_shipping || false
        })));
    }, [policies, loadingPolicies]);

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
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Featured Sellers */}
                    <div className="lg:col-span-1">
                        <h2 className="text-2xl font-bold mb-6">Featured Sellers</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {featuredSellers.map((seller) => (
                                <div key={seller.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                                    <Link to={`/storefront/${seller.id}`}>
                                        <LazyImage 
                                            src={seller.image_url || defaultImage} 
                                            alt={seller.username}
                                            className="w-full h-36 object-cover rounded-md mb-4"
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

                    {/* Recently Listed */}
                    <div className="lg:col-span-1">
                        <h2 className="text-2xl font-bold mb-6">Recently Listed</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recentListings.map((item) => (
                                <div key={item.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                                    <Link to={`/listing/${item.id}`}>
                                        <LazyImage 
                                            src={getListingImages(item)[0]} 
                                            alt={item.title}
                                            className="w-full h-36 object-cover rounded-md mb-4"
                                        />
                                        <h3 className="text-lg font-semibold line-clamp-1">{item.title}</h3>
                                        <p className="text-gray-600">${item.price}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500 truncate">Seller: {item.seller_name}</p>
                                            {item.offers_free_shipping && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Free Shipping
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Deals & Steals */}
                    <div className="lg:col-span-1">
                        <h2 className="text-2xl font-bold mb-6">Deals & Steals</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {deals.map((item) => (
                                <div key={item.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                                    <Link to={`/listing/${item.id}`}>
                                        <LazyImage 
                                            src={getListingImages(item)[0]} 
                                            alt={item.title}
                                            className="w-full h-36 object-cover rounded-md mb-4"
                                        />
                                        <h3 className="text-lg font-semibold line-clamp-1">{item.title}</h3>
                                        <p className="text-gray-600">${item.price}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500 truncate">Seller: {item.seller_name}</p>
                                            {item.offers_free_shipping && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Free Shipping
                                                </span>
                                            )}
                                        </div>
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