import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import axios from 'axios';

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
}

interface FilterState {
    condition: string;
    minPrice: string;
    maxPrice: string;
    category: string;
}

const ITEMS_PER_PAGE = 12;

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
            setResults(response.data.results);
            setTotalPages(Math.ceil(response.data.total / ITEMS_PER_PAGE));
        } catch (error) {
            console.error('Error fetching search results:', error);
            setError('Failed to fetch search results');
        } finally {
            setLoading(false);
        }
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
                            <Link to={`/listings/${result.id}`}>
                                <div className="aspect-w-16 aspect-h-9">
                                    <img 
                                        src={result.image_url || '/placeholder-card.png'} 
                                        alt={result.title}
                                        className="object-cover w-full h-48"
                                    />
                                </div>
                            </Link>
                            <div className="p-4">
                                <Link to={`/listings/${result.id}`}>
                                    <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                                        {result.title}
                                    </h2>
                                </Link>
                                <p className="mt-1 text-gray-600">{result.condition}</p>
                                <p className="mt-1 text-lg font-bold text-gray-900">${result.price.toFixed(2)}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <Link 
                                        to={`/seller/${result.seller_id}`}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Sold by {result.seller_name}
                                    </Link>
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