import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

interface CartItem {
    id: number;
    title: string;
    price: number;
    quantity: number;
    image: string;
    seller: string;
}

export const useCart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setCartItems([]);
                return;
            }

            const response = await axios.get('/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCartItems(response.data.items || []);
        } catch (err) {
            console.error('Error fetching cart:', err);
            setError('Failed to load cart items');
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (itemId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.post('/api/cart/add', 
                { itemId },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            fetchCart(); // Refresh cart after adding item
        } catch (err) {
            console.error('Error adding to cart:', err);
            setError('Failed to add item to cart');
        }
    };

    const removeFromCart = async (itemId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.post('/api/cart/remove', 
                { itemId },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            fetchCart(); // Refresh cart after removing item
        } catch (err) {
            console.error('Error removing from cart:', err);
            setError('Failed to remove item from cart');
        }
    };

    const updateQuantity = async (itemId: number, quantity: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.post('/api/cart/update', 
                { itemId, quantity },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            fetchCart(); // Refresh cart after updating quantity
        } catch (err) {
            console.error('Error updating cart:', err);
            setError('Failed to update cart');
        }
    };

    useEffect(() => {
        fetchCart();
    }, [user]); // Refetch when user changes

    return {
        cartItems,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        refreshCart: fetchCart
    };
}; 