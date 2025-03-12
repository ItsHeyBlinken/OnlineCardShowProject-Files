import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

// Helper function to ensure price is a number before formatting
const formatPrice = (price: any): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

// Interface for store customization settings
interface StoreCustomization {
  bannerImage?: string;
  colorMode?: 'light' | 'dark';
  backgroundColor?: string;
  backgroundImage?: string;
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  welcomeMessage?: string;
  socialLinks?: {
    instagram: string;
    twitter: string;
    facebook: string;
    tiktok: string;
  };
  viewMode?: 'grid' | 'list';
  featuredProductIds?: string[];
}

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
    storeBio?: string;
    storeLogo?: string;
}

const defaultImage = '/images/logo1.jpg';

const SellerStorefrontPage = () => {
    const { user } = useAuth();
    const { id: sellerId } = useParams<{ id: string }>();
    const [listings, setListings] = useState<Listing[]>([]);
    const [sellerName, setSellerName] = useState<string>('');
    const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
    const [customization, setCustomization] = useState<StoreCustomization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
    const [filters, setFilters] = useState({
        category: '',
        minPrice: '',
        maxPrice: '',
        condition: '',
        sortBy: 'newest'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // If we have a seller ID from URL params, use that, otherwise use the logged-in user's ID
            const id = sellerId || user?.id;
            if (!id) return;
            
            // Build query parameters for the API request
            const params = new URLSearchParams();
            
            if (filters.category) params.append('category', filters.category);
            if (filters.condition) params.append('condition', filters.condition);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (searchQuery) params.append('search', searchQuery);
            
            // Add pagination
            const limit = 12; // Number of items per page
            const offset = (pagination.currentPage - 1) * limit;
            params.append('limit', limit.toString());
            params.append('offset', offset.toString());
            
            // Fetch listings for the seller
            const listingsResponse = await axios.get(`/api/listings/store/${id}?${params.toString()}`);
            
            // Handle updated response format
            if (listingsResponse.data.listings) {
                // New API format
                setListings(listingsResponse.data.listings);
                setPagination({
                    currentPage: listingsResponse.data.page || 1,
                    totalPages: listingsResponse.data.totalPages || 1,
                    totalItems: listingsResponse.data.totalCount || 0
                });
            } else {
                // Old API format (backward compatibility)
                setListings(listingsResponse.data);
                setPagination({
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: listingsResponse.data.length
                });
            }
            
            // Get the seller name
            const fetchedListings = listingsResponse.data.listings || listingsResponse.data;
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
                    const seller = sellersResponse.data.find((s: any) => s.id === id);
                    
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
            
            // Fetch store customization settings
            try {
                // Try to fetch from API first
                const customizationResponse = await axios.get(`/api/stores/${id}`);
                if (customizationResponse.data && customizationResponse.data.customization) {
                    setCustomization(customizationResponse.data.customization);
                    
                    // Update seller profile with additional info if available
                    if (customizationResponse.data.name || customizationResponse.data.description) {
                        setSellerProfile(prevProfile => prevProfile ? {
                            ...prevProfile,
                            business_name: customizationResponse.data.name || prevProfile.business_name,
                            description: customizationResponse.data.description || prevProfile.description,
                            image_url: customizationResponse.data.logo_url || prevProfile.image_url,
                            offers_free_shipping: prevProfile.offers_free_shipping,
                            standard_shipping_fee: prevProfile.standard_shipping_fee,
                            uses_calculated_shipping: prevProfile.uses_calculated_shipping
                        } : null);
                    }
                    
                    // Set seller name if available
                    if (customizationResponse.data.name) {
                        setSellerName(customizationResponse.data.name);
                    }
                    
                    // Handle featured products if available
                    if (customizationResponse.data.customization.featuredProductIds && 
                        customizationResponse.data.customization.featuredProductIds.length > 0) {
                        const featuredIds = customizationResponse.data.customization.featuredProductIds;
                        const featured = fetchedListings.filter((listing: Listing) => 
                            featuredIds.includes(listing.id.toString())
                        );
                        setFeaturedListings(featured);
                    }
                }
            } catch (customizationError) {
                console.error('Error fetching customization:', customizationError);
                
                // Try to get customization from localStorage in development mode
                if (process.env.NODE_ENV === 'development') {
                    const savedCustomization = localStorage.getItem('storeCustomization');
                    if (savedCustomization) {
                        try {
                            const parsedCustomization = JSON.parse(savedCustomization);
                            setCustomization(parsedCustomization);
                            
                            // Update seller profile with additional info if available
                            if (parsedCustomization.storeName || parsedCustomization.storeBio) {
                                setSellerProfile(prevProfile => prevProfile ? {
                                    ...prevProfile,
                                    business_name: parsedCustomization.storeName || prevProfile.business_name,
                                    storeBio: parsedCustomization.storeBio || prevProfile.description,
                                    storeLogo: parsedCustomization.storeLogo || prevProfile.image_url,
                                    offers_free_shipping: prevProfile.offers_free_shipping,
                                    standard_shipping_fee: prevProfile.standard_shipping_fee,
                                    uses_calculated_shipping: prevProfile.uses_calculated_shipping
                                } : null);
                            }
                            
                            // Set seller name if available
                            if (parsedCustomization.storeName) {
                                setSellerName(parsedCustomization.storeName);
                            }
                        } catch (parseError) {
                            console.error('Error parsing localStorage customization:', parseError);
                        }
                    }
                }
            }
            
            setError('');
        } catch (err) {
            console.error('Error fetching store data:', err);
            setError('Failed to load store information');
        } finally {
            setLoading(false);
        }
    }, [sellerId, user, filters, searchQuery, pagination.currentPage]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value
        });
    };
    
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };
    
    const resetFilters = () => {
        setFilters({
            category: '',
            minPrice: '',
            maxPrice: '',
            condition: '',
            sortBy: 'newest'
        });
        setSearchQuery('');
        setPagination({
            ...pagination,
            currentPage: 1
        });
    };

    // Apply customization styles
    const getCustomStyles = () => {
        if (!customization) return {};
        
        const styles: React.CSSProperties = {};
        
        if (customization.backgroundColor) {
            styles.backgroundColor = customization.backgroundColor;
        }
        
        if (customization.backgroundImage) {
            styles.backgroundImage = `url(${customization.backgroundImage})`;
            styles.backgroundSize = 'cover';
            styles.backgroundPosition = 'center';
        }
        
        return styles;
    };
    
    // Get container class based on color mode
    const getContainerClass = () => {
        let baseClass = "min-h-screen py-8";
        
        if (customization?.colorMode === 'dark') {
            return `${baseClass} bg-gray-900 text-white`;
        }
        
        return `${baseClass} bg-gray-100`;
    };
    
    // Get card class based on color mode
    const getCardClass = () => {
        let baseClass = "block rounded-lg shadow overflow-hidden transition-shadow hover:shadow-md";
        
        if (customization?.colorMode === 'dark') {
            return `${baseClass} bg-gray-800 text-white`;
        }
        
        return `${baseClass} bg-white`;
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

    return (
        <div className={getContainerClass()} style={getCustomStyles()}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Banner image if available */}
                {customization?.bannerImage && (
                    <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                        <img 
                            src={customization.bannerImage} 
                            alt={`${sellerName}'s Store Banner`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                
                {/* Store header with logo if available */}
                <div className="flex items-center mb-6">
                    {sellerProfile?.storeLogo && (
                        <img 
                            src={sellerProfile.storeLogo} 
                            alt={`${sellerName}'s Logo`}
                            className="w-16 h-16 rounded-full mr-4 object-cover border-2 border-white shadow"
                        />
                    )}
                    <div>
                        <h1 className={`text-3xl font-bold ${customization?.colorMode === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                            {sellerProfile?.business_name || `${sellerName}'s Store`}
                        </h1>
                        {sellerProfile?.storeBio && (
                            <p className={`${customization?.colorMode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {sellerProfile.storeBio}
                            </p>
                        )}
                    </div>
                </div>
                
                {/* Welcome message if available */}
                {customization?.welcomeMessage && (
                    <div className={`p-4 rounded-lg mb-6 ${customization?.colorMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                        <p className="text-lg">{customization.welcomeMessage}</p>
                    </div>
                )}
                
                {/* Social links if available */}
                {customization?.socialLinks && Object.values(customization.socialLinks).some(link => link) && (
                    <div className="flex space-x-4 mb-6">
                        {customization.socialLinks.instagram && (
                            <a href={`https://instagram.com/${customization.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                                </svg>
                            </a>
                        )}
                        {customization.socialLinks.twitter && (
                            <a href={`https://twitter.com/${customization.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.059 10.059 0 01-3.127 1.195c-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045A13.98 13.98 0 011.64 3.162a4.978 4.978 0 001.54 6.655 4.796 4.796 0 01-2.23-.615v.06a4.997 4.997 0 004.004 4.9 4.99 4.99 0 01-2.25.085 4.997 4.997 0 004.657 3.465 10.04 10.04 0 01-6.208 2.144c-.403 0-.797-.023-1.19-.069a14.1 14.1 0 007.649 2.242c9.18 0 14.196-7.603 14.196-14.193 0-.216-.005-.431-.015-.646a10.156 10.156 0 002.499-2.584z"/>
                                </svg>
                            </a>
                        )}
                        {customization.socialLinks.facebook && (
                            <a href={`https://facebook.com/${customization.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                                </svg>
                            </a>
                        )}
                        {customization.socialLinks.tiktok && (
                            <a href={`https://tiktok.com/@${customization.socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-black hover:text-gray-800">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                            </a>
                        )}
                    </div>
                )}
                
                {/* Featured products if available */}
                {featuredListings.length > 0 && (
                    <div className="mb-10">
                        <h2 className={`text-xl font-bold ${customization?.colorMode === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                            Featured Products
                        </h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {featuredListings.map((listing) => (
                                <Link 
                                    key={`featured-${listing.id}`}
                                    to={`/listing/${listing.id}`}
                                    className={getCardClass()}
                                >
                                    <div className="relative">
                                        <img 
                                            src={listing.image_url || defaultImage} 
                                            alt={listing.title}
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = defaultImage;
                                            }}
                                        />
                                        <div className="absolute top-0 right-0 bg-yellow-500 text-white px-2 py-1 text-xs font-medium">
                                            Featured
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className={`text-lg font-medium ${customization?.colorMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {listing.title}
                                        </h3>
                                        <p className={`mt-1 line-clamp-2 ${customization?.colorMode === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                            {listing.description}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className={`text-lg font-bold ${
                                                customization?.customColors?.primary 
                                                    ? {style: {color: customization.customColors.primary}}
                                                    : customization?.colorMode === 'dark' ? 'text-white' : 'text-gray-900'
                                            }`}>
                                                ${formatPrice(listing.price)}
                                            </span>
                                            <span className={`text-sm ${customization?.colorMode === 'dark' ? 'text-gray-400' : 'text-gray-500'} capitalize`}>
                                                {listing.condition}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Search and Filters */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                    {/* Search Bar */}
                    <div className="md:col-span-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                id="search"
                                name="search"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Search cards by title, player, brand..."
                                type="search"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                    
                    {/* Category Filter */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            id="category"
                            name="category"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filters.category}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Categories</option>
                            <option value="Baseball">Baseball</option>
                            <option value="Basketball">Basketball</option>
                            <option value="Football">Football</option>
                            <option value="Hockey">Hockey</option>
                            <option value="Soccer">Soccer</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    {/* Price Range Filter */}
                    <div>
                        <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700">Price Range</label>
                        <div className="mt-1 flex space-x-2">
                            <input
                                type="number"
                                name="minPrice"
                                placeholder="Min"
                                className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                                min="0"
                            />
                            <span className="text-gray-500 self-center">-</span>
                            <input
                                type="number"
                                name="maxPrice"
                                placeholder="Max"
                                className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                min="0"
                            />
                        </div>
                    </div>
                    
                    {/* Condition Filter */}
                    <div>
                        <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Condition</label>
                        <select
                            id="condition"
                            name="condition"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filters.condition}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Conditions</option>
                            <option value="Mint">Mint</option>
                            <option value="Near Mint">Near Mint</option>
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                        </select>
                    </div>
                    
                    {/* Sort By */}
                    <div>
                        <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Sort By</label>
                        <select
                            id="sortBy"
                            name="sortBy"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filters.sortBy}
                            onChange={handleFilterChange}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="priceAsc">Price: Low to High</option>
                            <option value="priceDesc">Price: High to Low</option>
                        </select>
                    </div>
                    
                    <div className="md:col-span-4 flex justify-end">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
                
                {/* Main product listings */}
                <h2 className={`text-xl font-bold ${customization?.colorMode === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
                    All Products
                </h2>
                
                {listings.length > 0 ? (
                    <div className={`grid ${customization?.viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                        {listings.map((listing) => (
                            <Link 
                                key={listing.id} 
                                to={`/listing/${listing.id}`}
                                className={getCardClass()}
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
                                    <h3 className={`text-lg font-medium ${customization?.colorMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {listing.title}
                                    </h3>
                                    <p className={`mt-1 line-clamp-2 ${customization?.colorMode === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {listing.description}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className={`text-lg font-bold ${customization?.colorMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            ${formatPrice(listing.price)}
                                        </span>
                                        <span className={`text-sm ${customization?.colorMode === 'dark' ? 'text-gray-400' : 'text-gray-500'} capitalize`}>
                                            {listing.condition}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                                            customization?.colorMode === 'dark' 
                                                ? 'bg-gray-700 text-gray-300' 
                                                : 'bg-gray-200 text-gray-700'
                                        }`}>
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
                    <div className={`text-center py-12 rounded-lg shadow ${
                        customization?.colorMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500'
                    }`}>
                        <p className="text-lg">This seller doesn't have any listings yet.</p>
                    </div>
                )}

                {/* Pagination Controls - add after the listings grid */}
                {!loading && !error && listings.length > 0 && pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(prev.currentPage - 1, 1) }))}
                                disabled={pagination.currentPage === 1}
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                    pagination.currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNumber) => {
                                const isCurrentPage = pageNumber === pagination.currentPage;
                                
                                // Show current page, first, last, and pages around current
                                if (
                                    pageNumber === 1 || 
                                    pageNumber === pagination.totalPages || 
                                    (pageNumber >= pagination.currentPage - 1 && pageNumber <= pagination.currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNumber }))}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                isCurrentPage 
                                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' 
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                } else if (
                                    pageNumber === pagination.currentPage - 2 ||
                                    pageNumber === pagination.currentPage + 2
                                ) {
                                    // Show ellipsis
                                    return (
                                        <span
                                            key={pageNumber}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                        >
                                            ...
                                        </span>
                                    );
                                }
                                return null;
                            })}
                            
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.currentPage + 1, prev.totalPages) }))}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                    pagination.currentPage === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerStorefrontPage;
