import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const ProductListing: React.FC = () => {
    const [playerName, setPlayerName] = useState<string>('');
    const [year, setYear] = useState<string>('');
    const [brand, setBrand] = useState<string>('');
    const [condition, setCondition] = useState<string>('');
    const [cardNumber, setCardNumber] = useState<string>('');
    const [frontImage, setFrontImage] = useState<File | null>(null);
    const [backImage, setBackImage] = useState<File | null>(null);
    const [price, setPrice] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        if (frontImage) formData.append('frontImage', frontImage);
        if (backImage) formData.append('backImage', backImage);

        try {
            const imageUploadResponse = await axios.post('/api/upload-images', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const { frontImagePath, backImagePath } = imageUploadResponse.data;

            const listingData = {
                player_name: playerName,
                year,
                brand,
                condition,
                card_number: cardNumber,
                front_image: frontImagePath,
                back_image: backImagePath,
                price: parseFloat(price),
                quantity: parseInt(quantity),
            };

            await axios.post('/api/listings', listingData);

            // Reset form fields
            setPlayerName('');
            setYear('');
            setBrand('');
            setCondition('');
            setCardNumber('');
            setFrontImage(null);
            setBackImage(null);
            setPrice('');
            setQuantity('');
        } catch (error) {
            console.error('Error adding listing:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Player/Character Name" value={playerName} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)} required />
            <input type="text" placeholder="Year" value={year} onChange={(e: ChangeEvent<HTMLInputElement>) => setYear(e.target.value)} required />
            <input type="text" placeholder="Brand" value={brand} onChange={(e: ChangeEvent<HTMLInputElement>) => setBrand(e.target.value)} required />
            <select value={condition} onChange={(e: ChangeEvent<HTMLSelectElement>) => setCondition(e.target.value)} required>
                <option value="">Select Condition</option>
                <option value="raw">Raw</option>
                <option value="graded">Graded</option>
            </select>
            <input type="text" placeholder="Card Number" value={cardNumber} onChange={(e: ChangeEvent<HTMLInputElement>) => setCardNumber(e.target.value)} required />
            <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setFrontImage(e.target.files ? e.target.files[0] : null)} required />
            <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setBackImage(e.target.files ? e.target.files[0] : null)} required />
            <input type="number" placeholder="Price" value={price} onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)} required />
            <input type="number" placeholder="Quantity" value={quantity} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)} required />
            <button type="submit">Add Listing</button>
        </form>
    );
};

export default ProductListing;
