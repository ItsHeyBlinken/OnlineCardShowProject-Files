import React, { useState, useEffect } from 'react';
import { useLocation, useHistory, Link } from 'react-router-dom';
import axios from 'axios';
import useShippingPolicies from '../hooks/useShippingPolicies';

interface SearchResult {
    id: number;
    title: string;
    price: number;
    condition: string;
    image_url: string;
    seller_id: number;
    seller_name: string;
    description: string;
    category: string;
    offers_free_shipping?: boolean;
}

interface FilterState {
    condition: string;
    minPrice: string;
    maxPrice: string;
    category: string;
}

const ITEMS_PER_PAGE = 12;
const defaultImage = '/images/logo1.jpg';

const SearchResultsPage: React.FC = () => {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('newest');
    const location = useLocation();
    const history = useHistory();
    const [filters, setFilters] = useState<FilterState>({
        condition: '',
        minPrice: '',
        maxPrice: '',
        category: ''
    });

    const searchQuery = new URLSearchParams(location.search).get('search') || '';

    const updateUrlParams = (params: Record<string, string>) => {
        const searchParams = new URLSearchParams(location.search);
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                searchParams.set(key, value);
            } else {
                searchParams.delete(key);
            }
        });
        history.push(`${location.pathname}?${searchParams.toString()}`);
    };

    const fetchResults = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                query: searchQuery,
                page: currentPage.toString(),
                sort: sortBy,
                ...filters
            });

            const response = await axios.get(`/api/search?${params.toString()}`);
            const resultsData = response.data.results;
            
            // Set initial results without shipping info
            setResults(resultsData);
            setTotalPages(Math.ceil(response.data.total / ITEMS_PER_PAGE));
            
            // Get unique seller IDs for the hook
            const sellerIds = Array.from(
                new Set(
                    resultsData.map((result: SearchResult) => result.seller_id)
                )
            ) as number[];
            
            // Use the hook to fetch shipping policies
            const { policies } = await fetchShippingPolicies(sellerIds);
            
            // Apply shipping info to results
            setResults(prevResults => 
                prevResults.map(result => ({
                    ...result,
                    offers_free_shipping: policies[result.seller_id]?.offers_free_shipping || false
                }))
            );
        } catch (error) {
            console.error('Error fetching search results:', error);
            setError('Failed to fetch search results');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to fetch shipping policies
    const fetchShippingPolicies = async (sellerIds: number[]) => {
        if (!sellerIds.length) return { policies: {} };
        
        const policies: Record<number, any> = {};
        
        try {
            await Promise.all(
                sellerIds.map(async (sellerId) => {
                    try {
                        const response = await axios.get(`/api/shipping/policy/${sellerId}`);
                        policies[sellerId] = response.data;
                    } catch (error) {
                        console.error(`Error fetching shipping for seller ${sellerId}:`, error);
                        policies[sellerId] = {
                            offers_free_shipping: false,
                            standard_shipping_fee: 0,
                            shipping_policy: '',
                            uses_calculated_shipping: false
                        };
                    }
                })
            );
        } catch (error) {
            console.error('Error fetching shipping policies:', error);
        }
        
        return { policies };
    };

    useEffect(() => {
        fetchResults();
    }, [searchQuery, currentPage, sortBy, filters]);

    const handleFilterChange = (name: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset to first page when filters change
        updateUrlParams({ ...filters, [name]: value, page: '1' });
    };

    const handleSortChange = (value: string) => {
        setSortBy(value);
        setCurrentPage(1);
        updateUrlParams({ sort: value, page: '1' });
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrlParams({ page: page.toString() });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-6">Search Results for "{searchQuery}"</h1>
            
            {/* Filters and Sort Section */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <select
                    value={filters.condition}
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                    className="rounded border p-2"
                >
                    <option value="">All Conditions</option>
                    <option value="mint">Mint</option>
                    <option value="near-mint">Near Mint</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                </select>

                <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="rounded border p-2"
                />

                <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="rounded border p-2"
                />

                <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="rounded border p-2"
                >
                    <option value="">All Categories</option>
                    <option value="sports">Sports</option>
                    <option value="pokemon">Pokemon</option>
                    <option value="magic">Magic: The Gathering</option>
                    <option value="yugioh">Yu-Gi-Oh!</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="rounded border p-2"
                >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="best-match">Best Match</option>
                </select>
            </div>

            {results.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No results found for your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((result) => (
                        <div key={result.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <Link to={`/listing/${result.id}`}>
                                <div className="aspect-w-16 aspect-h-9">
                                    <img 
                                        src={result.image_url || defaultImage} 
                                        alt={result.title}
                                        className="object-cover w-full h-48"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = defaultImage;
                                        }}
                                    />
                                </div>
                            </Link>
                            <div className="p-4">
                                <Link to={`/listing/${result.id}`}>
                                    <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                                        {result.title}
                                    </h2>
                                </Link>
                                <p className="mt-1 text-gray-600">{result.condition}</p>
                                <p className="mt-1 text-lg font-bold text-gray-900">
                                    ${result.price ? Number(result.price).toFixed(2) : '0.00'}
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                    <Link 
                                        to={`/seller/${result.seller_id}`}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Sold by {result.seller_name}
                                    </Link>
                                    {result.offers_free_shipping && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Free Shipping
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="mt-8 flex justify-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded ${
                            currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        {page}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchResultsPage; 