import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSellerListings, updateListing, deleteListing } from '../api/listings';
import ImageDropzone from '../components/common/ImageDropzone';
import BackToDashboardButton from '../components/common/BackToDashboardButton';

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  image_url: string;
  image_urls: string[];
  year?: string;
  brand?: string;
  player_name?: string;
  card_number?: string;
  created_at: string;
}

const ManageListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const history = useHistory();
  const { user } = useAuth();
  
  // Form state for editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    category: '',
    year: '',
    brand: '',
    playerName: '',
    cardNumber: ''
  });
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [tempListingId, setTempListingId] = useState<string>('');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  
  useEffect(() => {
    fetchListings();
  }, []);
  
  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await getSellerListings();
      
      // Ensure all prices are properly converted to numbers
      const formattedData = data.map((listing: any) => ({
        ...listing,
        price: typeof listing.price === 'string' ? parseFloat(listing.price) : listing.price
      }));
      
      setListings(formattedData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to fetch listings. Please try again.');
      setLoading(false);
    }
  };
  
  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
    setFormData({
      title: listing.title,
      description: listing.description,
      price: listing.price.toString(),
      condition: listing.condition,
      category: listing.category,
      year: listing.year || '',
      brand: listing.brand || '',
      playerName: listing.player_name || '',
      cardNumber: listing.card_number || ''
    });
    
    // Set initial image URLs from the listing
    if (listing.image_urls && Array.isArray(listing.image_urls)) {
      setImageUrls(listing.image_urls);
    } else if (listing.image_url) {
      setImageUrls([listing.image_url]);
    } else {
      setImageUrls([]);
    }
    
    setShowEditModal(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleImagesUploaded = (urls: string[], listingId: string) => {
    setImageUrls(urls);
    setTempListingId(listingId);
    setShowImageUploader(false);
    setIsUpdatingImages(true);
  };

  const toggleImageUploader = () => {
    setShowImageUploader(!showImageUploader);
  };
  
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingListing) return;
    
    try {
      const updatedListing = {
        ...formData,
        price: parseFloat(formData.price),
        // Map playerName to player_name for the API
        player_name: formData.playerName,
        // Map cardNumber to card_number for the API
        card_number: formData.cardNumber,
        // Include image information if it was updated
        ...(isUpdatingImages && {
          image_urls: imageUrls,
          image_url: imageUrls.length > 0 ? imageUrls[0] : null,
          tempListingId
        })
      };
      
      await updateListing(editingListing.id, updatedListing);
      
      // Update the listing in the state with new data including images
      setListings(listings.map(listing => 
        listing.id === editingListing.id ? 
          { 
            ...listing, 
            ...updatedListing,
            player_name: updatedListing.player_name,
            card_number: updatedListing.card_number,
            image_url: isUpdatingImages && imageUrls.length > 0 ? imageUrls[0] : listing.image_url,
            image_urls: isUpdatingImages ? imageUrls : listing.image_urls
          } : 
          listing
      ));
      
      setShowEditModal(false);
      setEditingListing(null);
      setIsUpdatingImages(false);
    } catch (err) {
      console.error('Error updating listing:', err);
      setError('Failed to update listing. Please try again.');
    }
  };
  
  const confirmDelete = (id: number) => {
    setShowDeleteConfirm(id);
  };
  
  const handleDelete = async (id: number) => {
    try {
      await deleteListing(id);
      
      // Remove the listing from the state
      setListings(listings.filter(listing => listing.id !== id));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError('Failed to delete listing. Please try again.');
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };
  
  const handleCreateNew = () => {
    history.push('/seller/create-listing');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-4">
        <BackToDashboardButton />
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Listings</h1>
        <button
          onClick={handleCreateNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
        >
          Create New Listing
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {listings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You don't have any listings yet.</p>
          <button
            onClick={handleCreateNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <div key={listing.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 overflow-hidden">
                <img 
                  src={listing.image_url || '/placeholder-image.jpg'} 
                  alt={listing.title}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{listing.title}</h2>
                <p className="text-gray-700 mb-2 line-clamp-2">{listing.description}</p>
                <p className="text-lg font-bold text-indigo-600 mb-4">${typeof listing.price === 'number' ? listing.price.toFixed(2) : parseFloat(String(listing.price)).toFixed(2)}</p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(listing)}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded flex-1"
                  >
                    Edit
                  </button>
                  
                  {showDeleteConfirm === listing.id ? (
                    <div className="flex space-x-2 flex-1">
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex-1"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => confirmDelete(listing.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded flex-1"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Edit Listing</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Condition</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Condition</option>
                    <option value="Mint">Mint</option>
                    <option value="Near Mint">Near Mint</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Baseball">Baseball</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Football">Football</option>
                    <option value="Hockey">Hockey</option>
                    <option value="Soccer">Soccer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Year</label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Player Name</label>
                  <input
                    type="text"
                    name="playerName"
                    value={formData.playerName}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                {/* Image Management Section */}
                <div>
                  <label className="block text-gray-700 mb-2">Images</label>
                  
                  {/* Current Images */}
                  {imageUrls.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative h-24 w-24">
                            <img 
                              src={url} 
                              alt={`Listing ${index + 1}`} 
                              className="h-full w-full object-cover rounded-md"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {showImageUploader ? (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Upload New Images</h4>
                      <ImageDropzone 
                        onImagesUploaded={handleImagesUploaded} 
                        listingId={editingListing.id.toString()}
                      />
                      <button
                        type="button"
                        onClick={toggleImageUploader}
                        className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel upload
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleImageUploader}
                      className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md"
                    >
                      {imageUrls.length > 0 ? 'Change Images' : 'Add Images'}
                    </button>
                  )}
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                  >
                    Update Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageListingsPage; 