import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';

const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const history = useHistory();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleLogout = async () => {
        try {
            await logout();
            history.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        // Navigate to the search results page
        history.push(`/search?search=${encodeURIComponent(searchQuery)}`);
    };

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center flex-1">
                        <Link to="/" className="text-xl font-bold text-blue-600">
                            Online Card Show
                        </Link>
                        <div className="ml-10 flex items-center space-x-4">
                            <Link to="/listings" className="text-gray-700 hover:text-gray-900">
                                Browse Cards
                            </Link>
                            <Link to="/subscription-tiers" className="text-gray-700 hover:text-gray-900">
                                Pricing
                            </Link>
                        </div>
                        <div className="ml-auto max-w-xs w-full">
                            <form onSubmit={handleSearch} className="mr-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search listings..."
                                        className="rounded-full pl-3 pr-10 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                    />
                                    <button type="submit" className="absolute right-0 top-0 mt-1 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="flex items-center">
                        {/* Cart Icon */}
                        <Link to="/cart" className="relative mx-4 text-gray-700 hover:text-gray-900">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {itemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </Link>

                        <div className="flex items-center ml-4 space-x-4">
                            {!user?.role && (
                                <Link 
                                    to="/become-seller" 
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Become a Seller
                                </Link>
                            )}
                            {user ? (
                                <div className="relative group">
                                    <button className="flex items-center space-x-1 text-gray-700 hover:text-gray-900">
                                        <span>Account</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                                        {user.role === 'seller' ? (
                                            <>
                                                <Link to="/seller/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                    Seller Dashboard
                                                </Link>
                                                <Link to="/seller/storefront" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                    My Store
                                                </Link>
                                                <Link
                                                    to="/seller/shipping"
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Shipping Settings
                                                </Link>
                                            </>
                                        ) : (
                                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                My Profile
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex space-x-4">
                                    <Link
                                        to="/signup/buyer"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Sign Up
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Login
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;