import React from 'react';
import { useAuth } from '../hooks/useAuth';
import ShippingSettings from '../components/seller/ShippingSettings';
import BackToDashboardButton from '../components/common/BackToDashboardButton';

const SellerShippingPage: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <div className="text-center py-10">Please log in to access your seller shipping settings.</div>;
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Seller Shipping Settings</h1>
        <BackToDashboardButton />
      </div>
      <p className="text-gray-600 mb-8">Configure how you want to handle shipping for your products</p>
      
      <ShippingSettings />
    </div>
  );
};

export default SellerShippingPage; 