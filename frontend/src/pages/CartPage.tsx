import React from 'react'
import { Minus, Plus, Trash2, CreditCard } from 'lucide-react'
import { Button } from '../components/ui/Button' // Corrected import path
import { Input } from '../components/ui/Input' // Corrected import path
import axios from 'axios'
import { useCart } from '../hooks/useCart'
// Removed the import for useCart due to the error

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
  seller: string;
}

export const CartPage = () => {
  const { cartItems, updateQuantity } = useCart();

  // Ensure cartItems is an array before using reduce
  const cartTotal = Array.isArray(cartItems) 
    ? cartItems.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0 as number)
    : 0;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
          <div className="bg-white shadow sm:rounded-lg p-6">
            <p className="text-gray-500 text-center">Your cart is empty</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    try {
      await axios.post('/api/checkout', { items: cartItems })
      // Handle success
    } catch (error) {
      console.error('Error during checkout:', error)
    }
  }

  const shipping = 9.99
  const tax = (cartTotal as number) * 0.1; // 10% tax
  const total = (cartTotal as number) + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-12 gap-8">
          {/* Cart Items */}
          <div className="col-span-8">
            <div className="space-y-4">
              {cartItems.map((item: CartItem) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 rounded-lg bg-white p-4 shadow-sm"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-24 w-24 rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500">Seller: {item.seller}</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full p-1"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newQuantity = parseInt(e.target.value, 10);
                        updateQuantity(item.id, newQuantity);
                      }}
                      className="w-16"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full p-1"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-span-4">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-base font-semibold text-gray-900">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <Button className="mt-6 w-full" onClick={() => handleCheckout()}>
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}