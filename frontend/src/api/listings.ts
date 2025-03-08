import axios from 'axios';

// Get all listings for the seller
export const getSellerListings = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.get('/api/seller/listings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching seller listings:', error);
    throw error;
  }
};

// Create a new listing
export const createListing = async (listingData: any) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.post('/api/listings/create', listingData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
};

// Update an existing listing
export const updateListing = async (id: number, listingData: any) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.put(`/api/seller/listings/${id}`, listingData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
};

// Delete a listing
export const deleteListing = async (id: number) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.delete(`/api/seller/listings/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
};

// Get listing by ID
export const getListingById = async (id: number) => {
  try {
    const response = await axios.get(`/api/listings/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching listing details:', error);
    throw error;
  }
}; 