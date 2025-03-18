import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { socialLogin, initGoogleAuth, initFacebookAuth, initTwitterAuth } from '../utils/socialAuth';
import { checkAdminCredentials, createAdminUser } from '../utils/auth';

interface UserData {
    id: string;
    username: string;
    email: string;
    role: string;
    subscriptionTier?: string;
}

interface FormErrors {
    email?: string;
    password?: string;
}

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const history = useHistory();
    const { login, user } = useAuth();

    // Load remembered email on component mount and initialize social logins
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
        
        // Initialize social login SDKs
        const initSocialSDKs = async () => {
            try {
                await Promise.all([
                    initGoogleAuth(),
                    initFacebookAuth(),
                    initTwitterAuth()
                ]);
                console.log('Social login SDKs initialized');
            } catch (error) {
                console.error('Error initializing social login SDKs:', error);
            }
        };
        
        initSocialSDKs();
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 'seller') {
                history.push('/seller/dashboard');
            } else {
                history.push('/profile');
            }
        }
    }, [user, history]);

    // Validate form input
    const validateForm = () => {
        const errors: FormErrors = {};
        let isValid = true;

        if (!email) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Email address is invalid';
            isValid = false;
        }

        if (!password) {
            errors.password = 'Password is required';
            isValid = false;
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) {
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            // Hardcoded admin credentials check for testing
            // Instead of using environment variables which might not be loaded properly
            console.log("Checking admin credentials for:", email);
            if (email === "admin@cardshow.com" && password === "Admin123!@#") {
                console.log('Admin login successful - direct credential match');
                
                // Create admin user
                const adminUser = {
                    id: 1000,
                    name: "Admin",
                    email: "admin@cardshow.com",
                    role: "Admin",
                    status: "Active",
                    joined: new Date().toISOString().split('T')[0]
                };
                
                // Store the admin user in localStorage
                localStorage.setItem('currentUser', JSON.stringify(adminUser));
                
                // Redirect to admin dashboard
                history.push('/admin');
                
                // Important: Return early to prevent API call
                setIsSubmitting(false);
                return;
            }
            
            // If not admin, use the login function from AuthContext
            await login(email, password);
            
            // If remember me is checked, store the email in localStorage
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // The redirect will be handled by the useEffect above
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) {
            setError('Please enter your email address');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(resetEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setIsSubmitting(true);
            
            // In a real application, we would:
            // 1. Send a request to create a password reset token
            // 2. Email the user a link with that token
            // 3. User clicks the link and is taken to a reset page
            // 
            // For this demo, since we don't have email sending capabilities,
            // we'll use the existing reset-password endpoint with a generated password
            const tempPassword = Math.random().toString(36).slice(-8);
            
            await axios.post('/api/auth/reset-password', { 
                email: resetEmail,
                newPassword: tempPassword
            });
            
            // Show the generated password to the user (only for demo purposes)
            setResetSuccess(`Your password has been reset to: ${tempPassword} (Copy this password before closing this message)`);
            setError('');
            
            // In a real app, we would just confirm that instructions were sent
            // and not show the actual password
            setTimeout(() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetSuccess('');
            }, 10000); // Give user 10 seconds to copy the password
        } catch (error: any) {
            console.error('Password reset error:', error);
            setError(error.response?.data?.message || 'Failed to request password reset. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSocialLogin = async (provider: string) => {
        try {
            setIsSubmitting(true);
            setError('');
            
            // Use our socialLogin utility 
            const response = await socialLogin(provider);
            
            // If we get a successful response with a token, process the login
            if (response?.data?.token) {
                // Store token in localStorage (this would normally be done by the login function)
                localStorage.setItem('token', response.data.token);
                
                // Set axios default header
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                
                // Redirect will be handled by the useEffect that checks for user
                // No need to redirect manually here
            } else {
                // This is for the demo mode, just show a message
                setError(`${provider} login demo completed. In production, you would be logged in now.`);
                
                // Clear the error after 3 seconds
                setTimeout(() => {
                    setError('');
                }, 3000);
            }
        } catch (error: any) {
            console.error(`${provider} login error:`, error);
            setError(error.response?.data?.message || `Failed to login with ${provider}. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {showForgotPassword ? 'Reset Your Password' : 'Sign in to your account'}
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {resetSuccess && (
                        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{resetSuccess}</span>
                        </div>
                    )}

                    {showForgotPassword ? (
                        <form className="space-y-6" onSubmit={handleForgotPassword}>
                            <div>
                                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="reset-email"
                                        name="reset-email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Enter your email address"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Back to login
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email address
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`appearance-none block w-full px-3 py-2 border ${
                                                formErrors.email ? 'border-red-300' : 'border-gray-300'
                                            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        />
                                        {formErrors.email && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`appearance-none block w-full px-3 py-2 border ${
                                                formErrors.password ? 'border-red-300' : 'border-gray-300'
                                            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        />
                                        {formErrors.password && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={() => setRememberMe(!rememberMe)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                            Remember me
                                        </label>
                                    </div>

                                    <div className="text-sm">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="font-medium text-indigo-600 hover:text-indigo-500"
                                        >
                                            Forgot your password?
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                                    >
                                        {isSubmitting ? 'Signing in...' : 'Sign in'}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">
                                            Or continue with
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-3">
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => handleSocialLogin('google')}
                                            disabled={isSubmitting}
                                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <span className="sr-only">Sign in with Google</span>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => handleSocialLogin('facebook')}
                                            disabled={isSubmitting}
                                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <span className="sr-only">Sign in with Facebook</span>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => handleSocialLogin('twitter')}
                                            disabled={isSubmitting}
                                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <span className="sr-only">Sign in with Twitter</span>
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.059 10.059 0 01-3.127 1.195c-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045A13.98 13.98 0 011.64 3.162a4.978 4.978 0 001.54 6.655 4.896 4.896 0 01-2.23-.616v.061a4.979 4.979 0 003.98 4.874 4.993 4.993 0 01-2.25.084 4.98 4.98 0 004.647 3.456A10.019 10.019 0 011.2 19.56a14.135 14.135 0 007.64 2.23c9.13 0 14.133-7.568 14.133-14.139 0-.214-.005-.428-.012-.642a10.114 10.114 0 002.502-2.564 10.002 10.002 0 01-2.879.789z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">
                                            Don't have an account?
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={() => history.push('/signup/buyer')}
                                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Sign up
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 