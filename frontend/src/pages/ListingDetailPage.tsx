import React, { useState, useEffect } from 'react';
import { useParams, Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import ImageGallery from '../components/common/ImageGallery';
import { useAuth } from '../hooks/useAuth';
import { useCart, CartItem } from '../contexts/CartContext';

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  image_url: string | null;
  image_urls?: string[];
  created_at: string;
  seller_id: number;
  seller_name: string;
  year?: string;
  brand?: string;
  player_name?: string;
  card_number?: string;
}

// Helper function to ensure price is a number before formatting
const formatPrice = (price: any): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const history = useHistory();
  const [sellerShippingInfo, setSellerShippingInfo] = useState({
    offers_free_shipping: false,
    standard_shipping_fee: 0,
    shipping_policy: '',
    uses_calculated_shipping: false
  });
  
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/listings/${id}`);
        setListing(response.data);
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError('Failed to load listing details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  useEffect(() => {
    if (listing?.seller_id) {
      const fetchSellerShippingInfo = async () => {
        try {
          const response = await axios.get(`/api/shipping/policy/${listing.seller_id}`);
          setSellerShippingInfo(response.data);
        } catch (error) {
          console.error('Error fetching seller shipping info:', error);
        }
      };
      
      fetchSellerShippingInfo();
    }
  }, [listing?.seller_id]);

  // Helper function to get image URLs from a listing, with fallback to the single image_url
  const getListingImages = (listing: Listing): string[] => {
    if (listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0) {
      return listing.image_urls;
    }
    return listing.image_url ? [listing.image_url] : [];
  };

  const handleMessageSeller = () => {
    if (!user) {
      // If user is not logged in, prompt them
      alert('Please log in to message the seller');
      return;
    }

    if (parseInt(user.id) === listing?.seller_id) {
      // Prevent messaging yourself
      alert("You can't message yourself as the seller");
      return;
    }

    // Navigate to inbox with query params to create a new message
    window.location.href = `/inbox?new=true&receiverId=${listing?.seller_id}&listingId=${id}&receiverName=${encodeURIComponent(listing?.seller_name || '')}&listingTitle=${encodeURIComponent(listing?.title || '')}`;
  };

  const handleAddToCart = () => {
    if (!listing) return;
    
    const cartItem: CartItem = {
      id: listing.id,
      title: listing.title,
      price: listing.price,
      quantity: quantity,
      image_url: listing.image_url || undefined,
      seller_id: listing.seller_id
    };
    
    addToCart(cartItem);
    
    // Show confirmation message
    const confirmMessage = window.confirm('Item added to cart! Would you like to view your cart?');
    if (confirmMessage) {
      history.push('/cart');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!listing) return <div className="text-center py-8">Listing not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex flex-col lg:flex-row">
          {/* Left side - Image Gallery */}
          <div className="lg:w-1/2 p-4">
            <ImageGallery 
              images={getListingImages(listing)} 
              alt={listing.title} 
            />
            <p className="text-xs text-gray-500 mt-2 text-center italic">Tip: Use the zoom controls or click and drag to explore image details</p>
          </div>
          
          {/* Right side - Details */}
          <div className="lg:w-1/2 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>
            
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-green-600">${formatPrice(listing.price)}</span>
              <span className="ml-2 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                {listing.condition}
              </span>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-gray-200 pt-4 mb-6">
              <div>
                <span className="text-sm text-gray-500">Category</span>
                <p className="font-medium">{listing.category}</p>
              </div>
              
              {listing.year && (
                <div>
                  <span className="text-sm text-gray-500">Year</span>
                  <p className="font-medium">{listing.year}</p>
                </div>
              )}
              
              {listing.brand && (
                <div>
                  <span className="text-sm text-gray-500">Brand</span>
                  <p className="font-medium">{listing.brand}</p>
                </div>
              )}
              
              {listing.player_name && (
                <div>
                  <span className="text-sm text-gray-500">Player/Character</span>
                  <p className="font-medium">{listing.player_name}</p>
                </div>
              )}
              
              {listing.card_number && (
                <div>
                  <span className="text-sm text-gray-500">Card Number</span>
                  <p className="font-medium">{listing.card_number}</p>
                </div>
              )}
              
              <div>
                <span className="text-sm text-gray-500">Listed On</span>
                <p className="font-medium">{new Date(listing.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-lg font-semibold mb-2">Seller Information</h2>
              <Link 
                to={`/storefront/${listing.seller_id}`} 
                className="text-blue-600 hover:text-blue-800"
              >
                {listing.seller_name}
              </Link>
            </div>
            
            <div className="mt-6 mb-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <div className="flex items-center w-32 border border-gray-300 rounded-md overflow-hidden">
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center border-0 focus:ring-0 focus:outline-none"
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <h2 className="text-lg font-semibold mb-2">Shipping Information</h2>
              
              {sellerShippingInfo.offers_free_shipping ? (
                <div className="flex items-center text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Free Shipping</span>
                </div>
              ) : sellerShippingInfo.standard_shipping_fee > 0 ? (
                <p className="text-gray-700">
                  Standard shipping fee: ${formatPrice(sellerShippingInfo.standard_shipping_fee)}
                </p>
              ) : sellerShippingInfo.uses_calculated_shipping ? (
                <p className="text-gray-700">
                  Shipping cost calculated at checkout based on location and weight.
                </p>
              ) : (
                <p className="text-gray-700">
                  Shipping cost will be calculated at checkout.
                </p>
              )}
              
              {sellerShippingInfo.shipping_policy && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Shipping Policy:</span> {sellerShippingInfo.shipping_policy}
                </div>
              )}
            </div>
            
            <div className="mt-8 space-x-4">
              <button 
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
              <button 
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                onClick={handleMessageSeller}
              >
                Message Seller
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage; 