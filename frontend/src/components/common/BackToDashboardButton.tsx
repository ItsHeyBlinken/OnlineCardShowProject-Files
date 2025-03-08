import React from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackToDashboardButtonProps {
  className?: string;
}

const BackToDashboardButton: React.FC<BackToDashboardButtonProps> = ({ className = '' }) => {
  const history = useHistory();

  const handleBackClick = () => {
    history.push('/seller/dashboard');
  };

  return (
    <button
      onClick={handleBackClick}
      className={`inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${className}`}
      aria-label="Back to Dashboard"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Back to Dashboard</span>
    </button>
  );
};

export default BackToDashboardButton; 