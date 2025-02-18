import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const { user, logout } = useAuth();
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
                            <input
                                type="text"
                                placeholder="Search cards..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

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
        </nav>
    );
};

export default Navbar;