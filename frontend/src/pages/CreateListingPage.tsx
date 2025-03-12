import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import ImageDropzone from '../components/common/ImageDropzone';
import BackToDashboardButton from '../components/common/BackToDashboardButton';

interface ListingForm {
    title: string;
    description: string;
    price: string;
    condition: string;
    category: string;
    year: string;
    brand: string;
    playerName: string;
    cardNumber: string;
}

const CreateListingPage = () => {
    const history = useHistory();
    const [error, setError] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [tempListingId, setTempListingId] = useState<string>('');
    const [showImageUploader, setShowImageUploader] = useState(false);
    const [formData, setFormData] = useState<ListingForm>({
        title: '',
        description: '',
        price: '',
        condition: '',
        category: '',
        year: '',
        brand: '',
        playerName: '',
        cardNumber: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImagesUploaded = (urls: string[], listingId: string) => {
        setImageUrls(urls);
        setTempListingId(listingId);
        // Hide the uploader after successful upload
        setShowImageUploader(false);
    };

    const toggleImageUploader = () => {
        setShowImageUploader(!showImageUploader);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (imageUrls.length === 0) {
            setError('Please upload at least one image for your listing');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            
            // Create the listing with the image URLs
            const response = await axios.post('/api/listings/create', 
                {
                    ...formData,
                    price: parseFloat(formData.price),
                    imageUrls,
                    tempListingId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Associate uploaded images with the newly created listing
            if (response.data && response.data.id) {
                await axios.post('/api/images/associate', {
                    tempListingId,
                    listingId: response.data.id,
                    imageUrls
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
            
            history.push('/seller/dashboard');
        } catch (error) {
            console.error('Error creating listing:', error);
            setError('Failed to create listing. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-4">
                    <BackToDashboardButton />
                </div>
                <div className="bg-white shadow rounded-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Create New Listing
                    </h1>
                    {error && (
                        <div className="mb-4 text-red-600">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Year
                            </label>
                            <input
                                type="text"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Brand
                            </label>
                            <input
                                type="text"
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Player Name
                            </label>
                            <input
                                type="text"
                                name="playerName"
                                value={formData.playerName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Card Number
                            </label>
                            <input
                                type="text"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Condition
                            </label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select condition</option>
                                <option value="Mint">Mint</option>
                                <option value="Near Mint">Near Mint</option>
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Poor">Poor</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select category</option>
                                <option value="Baseball">Baseball</option>
                                <option value="Basketball">Basketball</option>
                                <option value="Football">Football</option>
                                <option value="Hockey">Hockey</option>
                                <option value="Soccer">Soccer</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Images
                            </label>
                            
                            {imageUrls.length > 0 ? (
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {imageUrls.map((url, index) => (
                                            <div key={index} className="relative w-24 h-24">
                                                <img 
                                                    src={url} 
                                                    alt={`Uploaded ${index + 1}`} 
                                                    className="h-full w-full object-cover rounded-md"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleImageUploader}
                                        className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                    >
                                        {showImageUploader ? 'Hide Uploader' : 'Edit Images'}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={toggleImageUploader}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Upload Images
                                </button>
                            )}
                            
                            {showImageUploader && (
                                <div className="mt-4 p-4 border border-gray-200 rounded-md">
                                    <ImageDropzone onImagesUploaded={handleImagesUploaded} maxFiles={5} />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={imageUrls.length === 0}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                                    imageUrls.length === 0 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                }`}
                            >
                                Create Listing
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateListingPage; 