import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import ImageDropzone from '../common/ImageDropzone';

const ProductListing: React.FC = () => {
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [playerName, setPlayerName] = useState<string>('');
    const [year, setYear] = useState<string>('');
    const [brand, setBrand] = useState<string>('');
    const [cardNumber, setCardNumber] = useState<string>('');
    const [condition, setCondition] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [tempListingId, setTempListingId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleImagesUploaded = (urls: string[], listingId: string) => {
        setImageUrls(urls);
        setTempListingId(listingId);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (imageUrls.length === 0) {
            setSubmitError('Please upload at least one image for your listing');
            return;
        }
        
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            const listingData = {
                title,
                description,
                price: parseFloat(price),
                condition,
                category,
                imageUrls,
                tempListingId,
                year,
                brand,
                playerName,
                cardNumber
            };

            // Create the listing
            const listingResponse = await axios.post('/api/listings/create', listingData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const newListingId = listingResponse.data.id;
            
            // Associate the uploaded images with the new listing
            await axios.post('/api/images/associate', {
                tempListingId,
                listingId: newListingId,
                imageUrls
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Reset form fields
            setTitle('');
            setDescription('');
            setPlayerName('');
            setYear('');
            setBrand('');
            setCardNumber('');
            setCondition('');
            setCategory('');
            setPrice('');
            setImageUrls([]);
            setTempListingId('');
            setSubmitSuccess(true);
        } catch (error) {
            console.error('Error adding listing:', error);
            setSubmitError('Failed to create listing. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Listing</h1>
                
                {submitSuccess && (
                    <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
                        Listing created successfully!
                    </div>
                )}
                
                {submitError && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
                        {submitError}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            required 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            rows={4}
                            required 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Player/Character Name</label>
                        <input 
                            type="text" 
                            value={playerName} 
                            onChange={(e) => setPlayerName(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                        <input 
                            type="text" 
                            value={year} 
                            onChange={(e) => setYear(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <input 
                            type="text" 
                            value={brand} 
                            onChange={(e) => setBrand(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                        <input 
                            type="text" 
                            value={cardNumber} 
                            onChange={(e) => setCardNumber(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                        <select 
                            value={condition} 
                            onChange={(e) => setCondition(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            required
                        >
                            <option value="">Select Condition</option>
                            <option value="mint">Mint</option>
                            <option value="near-mint">Near Mint</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            required
                        >
                            <option value="">Select Category</option>
                            <option value="sports">Sports Cards</option>
                            <option value="pokemon">Pokemon Cards</option>
                            <option value="yugioh">Yu-Gi-Oh Cards</option>
                            <option value="magic">Magic: The Gathering</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                        <ImageDropzone onImagesUploaded={handleImagesUploaded} />
                        {imageUrls.length > 0 && (
                            <div className="mt-2 text-sm text-green-600">
                                {imageUrls.length} image(s) uploaded successfully
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                        <input 
                            type="number" 
                            value={price} 
                            onChange={(e) => setPrice(e.target.value)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            step="0.01"
                            required 
                        />
                    </div>
                    
                    <div className="flex justify-end">
                        <button 
                            type="submit"
                            disabled={isSubmitting || imageUrls.length === 0}
                            className={`px-4 py-2 text-white rounded-md ${
                                isSubmitting || imageUrls.length === 0
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isSubmitting ? 'Creating Listing...' : 'Add Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductListing;
