import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

interface SellerShippingInfo {
  seller_id: number;
  offers_free_shipping: boolean;
  shipping_policy?: string;
}

export const CartPage: React.FC = () => {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    subtotal, 
    tax, 
    shippingMethods,
    selectedShippingMethod,
    setSelectedShippingMethod,
    shippingCost,
    total, 
    itemCount,
    isLoading
  } = useCart();
  const { user } = useAuth();
  const history = useHistory();
  const [sellerShippingInfo, setSellerShippingInfo] = useState<{[key: string]: SellerShippingInfo}>({});
  const [loadingShippingInfo, setLoadingShippingInfo] = useState(false);

  // Fetch shipping policies for sellers of items in cart
  useEffect(() => {
    if (items.length === 0) return;
    
    const fetchSellerShippingPolicies = async () => {
      setLoadingShippingInfo(true);
      
      // Create an array of unique seller IDs
      const uniqueSellerIds = Array.from(new Set(items.map(item => item.seller_id)));
      const shippingInfo: {[key: string]: SellerShippingInfo} = {};
      
      try {
        // Fetch all shipping policies in parallel
        await Promise.all(
          uniqueSellerIds.map(async (sellerId) => {
            try {
              const response = await axios.get(`/api/shipping/policy/${sellerId}`);
              shippingInfo[sellerId] = {
                seller_id: sellerId,
                offers_free_shipping: response.data.offers_free_shipping || false,
                shipping_policy: response.data.shipping_policy
              };
            } catch (error) {
              console.error(`Error fetching shipping for seller ${sellerId}:`, error);
              // If we can't get the policy, just add a default
              shippingInfo[sellerId] = {
                seller_id: sellerId,
                offers_free_shipping: false
              };
            }
          })
        );
        
        setSellerShippingInfo(shippingInfo);
      } catch (error) {
        console.error('Error fetching seller shipping policies:', error);
      } finally {
        setLoadingShippingInfo(false);
      }
    };
    
    fetchSellerShippingPolicies();
  }, [items]);

  const handleCheckout = () => {
    if (!user) {
      // Redirect to login if user is not logged in
      history.push('/login?redirect=checkout');
    } else {
      // Proceed to checkout
      history.push('/checkout');
    }
  };

  // Helper function to ensure price is a number before formatting
  const formatPrice = (price: any): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  // Group items by seller
  const itemsBySeller = items.reduce((acc: {[key: number]: typeof items}, item) => {
    if (!acc[item.seller_id]) {
      acc[item.seller_id] = [];
    }
    acc[item.seller_id].push(item);
    return acc;
  }, {});

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-xl mb-4">Your cart is empty</p>
          <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Cart Items */}
        <div className="md:w-2/3">
          {/* Display items grouped by seller */}
          {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => (
            <div key={sellerId} className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="font-medium">Seller ID: {sellerId}</h3>
                {sellerShippingInfo[sellerId]?.offers_free_shipping && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Free Shipping
                  </span>
                )}
                {sellerShippingInfo[sellerId]?.shipping_policy && (
                  <p className="text-sm text-gray-600 mt-1">{sellerShippingInfo[sellerId].shipping_policy}</p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sellerItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.image_url && (
                              <div className="flex-shrink-0 h-16 w-16 mr-4">
                                <img 
                                  className="h-16 w-16 object-cover rounded" 
                                  src={item.image_url} 
                                  alt={item.title} 
                                />
                              </div>
                            )}
                            <div>
                              <Link 
                                to={`/listings/${item.id}`} 
                                className="text-lg font-medium text-gray-900 hover:text-blue-600"
                              >
                                {item.title}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${formatPrice(item.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center border rounded-md w-32">
                            <button
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </button>
                            <span className="flex-1 text-center py-2">{item.quantity}</span>
                            <button
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${formatPrice(Number(item.price) * item.quantity)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium w-24">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-900 focus:outline-none"
                            aria-label="Remove item"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        
        {/* Cart Summary */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Items ({itemCount}):</span>
                <span>${formatPrice(subtotal)}</span>
              </div>
              
              {/* Shipping Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Method:
                </label>
                {isLoading || loadingShippingInfo ? (
                  <div className="text-sm text-gray-500">Loading shipping options...</div>
                ) : shippingMethods.length > 0 ? (
                  <div className="space-y-2">
                    {shippingMethods.map(method => (
                      <div key={method.id} className="flex items-center">
                        <input
                          id={`shipping-${method.id}`}
                          name="shipping-method"
                          type="radio"
                          checked={selectedShippingMethod?.id === method.id}
                          onChange={() => setSelectedShippingMethod(method)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label 
                          htmlFor={`shipping-${method.id}`} 
                          className="ml-2 block text-sm text-gray-700 cursor-pointer flex-grow"
                        >
                          {method.display_name} ({method.provider})
                        </label>
                        {selectedShippingMethod?.id === method.id && (
                          <span className="text-sm font-medium text-gray-900">
                            ${formatPrice(shippingCost)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No shipping methods available</div>
                )}
              </div>
              
              <div className="flex justify-between mb-2">
                <span>Shipping:</span>
                {shippingCost > 0 ? (
                  <span>${formatPrice(shippingCost)}</span>
                ) : (
                  <span>--</span>
                )}
              </div>
              
              <div className="flex justify-between mb-2">
                <span>Sales Tax:</span>
                <span>${formatPrice(tax)}</span>
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between mb-4">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">${formatPrice(total)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={isLoading || loadingShippingInfo || shippingMethods.length === 0}
                >
                  {isLoading || loadingShippingInfo ? 'Loading...' : 'Proceed to Checkout'}
                </button>
                <Link
                  to="/"
                  className="w-full text-center border border-gray-300 px-6 py-3 rounded-md mt-4 inline-block hover:bg-gray-50"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
