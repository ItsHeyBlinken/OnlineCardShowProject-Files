import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const ProductListing: React.FC = () => {
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [playerName, setPlayerName] = useState<string>('');
    const [year, setYear] = useState<string>('');
    const [brand, setBrand] = useState<string>('');
    const [cardNumber, setCardNumber] = useState<string>('');
    const [condition, setCondition] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [frontImage, setFrontImage] = useState<File | null>(null);
    const [price, setPrice] = useState<string>('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        if (frontImage) formData.append('image', frontImage);

        try {
            const imageUploadResponse = await axios.post('/api/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const { imagePath } = imageUploadResponse.data;

            const listingData = {
                title,
                description,
                price: parseFloat(price),
                condition,
                category,
                imageUrl: imagePath,
                year,
                brand,
                playerName,
                cardNumber
            };

            await axios.post('/api/listings/create', listingData, {
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
            setFrontImage(null);
            setPrice('');
        } catch (error) {
            console.error('Error adding listing:', error);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Listing</h1>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                        <input 
                            type="file" 
                            onChange={(e) => setFrontImage(e.target.files ? e.target.files[0] : null)} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        />
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
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Add Listing
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductListing;
