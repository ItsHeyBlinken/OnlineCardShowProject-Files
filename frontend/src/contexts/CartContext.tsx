import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

export interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
  seller_id: number;
  weight_oz?: number; // optional weight in ounces
}

interface ShippingMethod {
  id: number;
  name: string;
  display_name: string;
  provider: string;
  service_code: string;
  description: string;
}

interface ShippingCost {
  shipping_method_id: number;
  provider: string;
  service: string;
  weight_oz: number;
  cost: number;
  estimated_delivery_days: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  tax: number;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  shippingMethods: ShippingMethod[];
  selectedShippingMethod: ShippingMethod | null;
  setSelectedShippingMethod: (method: ShippingMethod) => void;
  shippingCost: number;
  total: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initialization
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Default tax rate - can be updated based on user's location
  const [taxRate, setTaxRate] = useState<number>(0.0725); // 7.25% as example (California base rate)
  
  // Shipping related state
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Calculate total items and price whenever cart changes
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  
  // Calculate subtotal (before tax and shipping)
  const subtotal = items.reduce((sum, item) => {
    // Ensure price is treated as a number
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price);
    return sum + (itemPrice * item.quantity);
  }, 0);
  
  // Calculate tax amount
  const tax = Number((subtotal * taxRate).toFixed(2));
  
  // Calculate final total (with tax and shipping)
  const total = subtotal + tax + shippingCost;
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);
  
  // Fetch shipping methods when component mounts
  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/shipping/methods');
        setShippingMethods(response.data);
        
        // Set default shipping method to the first one if available
        if (response.data.length > 0) {
          setSelectedShippingMethod(response.data[0]);
        }
        
      } catch (error) {
        console.error('Error fetching shipping methods:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShippingMethods();
  }, []);
  
  // Calculate shipping cost when selected method or items change
  useEffect(() => {
    const calculateShipping = async () => {
      if (!selectedShippingMethod || items.length === 0) {
        setShippingCost(0);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await axios.post('/api/shipping/calculate', {
          items: items,
          shipping_method_id: selectedShippingMethod.id,
          to_zipcode: '90210' // This would normally come from the user's saved address
        });
        
        setShippingCost(Number(response.data.cost));
      } catch (error) {
        console.error('Error calculating shipping cost:', error);
        setShippingCost(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculateShipping();
  }, [selectedShippingMethod, items]);

  const addToCart = (newItem: CartItem) => {
    // Ensure price is a number before adding to cart
    const itemToAdd = {
      ...newItem,
      price: typeof newItem.price === 'string' ? parseFloat(newItem.price) : Number(newItem.price)
    };

    setItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(item => item.id === itemToAdd.id);
      
      if (existingItemIndex >= 0) {
        // If item exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + itemToAdd.quantity
        };
        return updatedItems;
      } else {
        // If item doesn't exist, add it to cart
        return [...prevItems, itemToAdd];
      }
    });
  };

  const removeFromCart = (id: number) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      // If we've removed all items, also reset the shipping method selection
      if (newItems.length === 0) {
        setSelectedShippingMethod(null);
        setShippingCost(0);
      }
      return newItems;
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      tax,
      taxRate,
      setTaxRate,
      shippingMethods,
      selectedShippingMethod,
      setSelectedShippingMethod,
      shippingCost,
      total,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 