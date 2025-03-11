import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';

interface OrderDetails {
  id: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  status: string;
  shipping_info?: {
    shipping_method_id: number;
    shipping_cost: number;
  };
}

// Helper function to ensure price is a number before formatting
const formatPrice = (price: any): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

export const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const { clearCart } = useCart();
  
  useEffect(() => {
    // Extract order ID from URL query parameters if available
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    
    if (id !== orderId) {
      setOrderId(id);
      
      // Clear the cart if it hasn't been cleared yet
      clearCart();

      // If we have an orderId, fetch order details
      if (id) {
        setLoading(true);
        axios.get(`/api/orders/${id}`)
          .then(async response => {
            setOrderDetails(response.data);
            
            // If there's shipping info with a method ID, fetch the shipping method details
            if (response.data.shipping_info?.shipping_method_id) {
              try {
                const shippingResponse = await axios.get('/api/shipping/methods');
                const methods = shippingResponse.data;
                const method = methods.find((m: any) => m.id === response.data.shipping_info.shipping_method_id);
                if (method) {
                  setShippingMethod(`${method.display_name} (${method.provider})`);
                }
              } catch (error) {
                console.error('Error fetching shipping method:', error);
              }
            }
          })
          .catch(error => {
            console.error('Error fetching order details:', error);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [location.search, clearCart, orderId]);
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8 text-center mb-8">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
        <p className="text-lg text-gray-700 mb-6">
          Thank you for your purchase. Your order has been received and is being processed.
        </p>
        
        {orderId && (
          <p className="text-gray-600 mb-4">
            Order Reference: <span className="font-medium">{orderId}</span>
          </p>
        )}

        {loading ? (
          <div className="my-6 text-gray-500">Loading order details...</div>
        ) : orderDetails && (
          <div className="border-t border-b py-4 my-6 max-w-sm mx-auto">
            <h2 className="font-semibold text-lg mb-2">Order Summary</h2>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Subtotal:</span>
              <span>${formatPrice(orderDetails.subtotal)}</span>
            </div>
            {orderDetails.tax_amount !== undefined && orderDetails.tax_amount > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Tax:</span>
                <span>${formatPrice(orderDetails.tax_amount)}</span>
              </div>
            )}
            {orderDetails.shipping_info && orderDetails.shipping_info.shipping_cost > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Shipping:</span>
                <span>${formatPrice(orderDetails.shipping_info.shipping_cost)}</span>
              </div>
            )}
            {shippingMethod && (
              <div className="text-sm text-gray-600 my-2 text-left">
                <span className="font-medium">Shipping Method:</span> {shippingMethod}
              </div>
            )}
            <div className="flex justify-between font-medium mt-2">
              <span>Total:</span>
              <span>${formatPrice(orderDetails.total_amount)}</span>
            </div>
          </div>
        )}
        
        <p className="text-gray-600 mb-10">
          A confirmation email has been sent to your email address.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/order-history"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            View Order History
          </Link>
          <Link
            to="/"
            className="border border-gray-300 px-6 py-3 rounded-md hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}; 