import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import ImageGallery from '../components/common/ImageGallery';

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

const defaultImage = '/images/logo1.jpg';

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Helper function to get image URLs from a listing, with fallback to the single image_url
  const getListingImages = (listing: Listing): string[] => {
    if (listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0) {
      return listing.image_urls;
    }
    return listing.image_url ? [listing.image_url] : [defaultImage];
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
              <span className="text-2xl font-bold text-green-600">${Number(listing.price).toFixed(2)}</span>
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
            
            <div className="mt-8 space-x-4">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                Add to Cart
              </button>
              <button className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition">
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