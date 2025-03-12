import React from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface BackToDashboardButtonProps {
  className?: string;
  customReturnPath?: string;
  buttonText?: string;
}

const BackToDashboardButton: React.FC<BackToDashboardButtonProps> = ({ 
  className = '', 
  customReturnPath,
  buttonText = 'Back to Dashboard'
}) => {
  const history = useHistory();
  const { user } = useAuth();

  const handleBackClick = () => {
    if (customReturnPath) {
      history.push(customReturnPath);
    } else if (user?.role === 'seller' || user?.is_seller) {
      history.push('/seller/dashboard');
    } else {
      // For buyers or any other role, go to profile
      history.push('/profile');
    }
  };

  return (
    <button
      onClick={handleBackClick}
      className={`inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${className}`}
      aria-label={buttonText}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{buttonText}</span>
    </button>
  );
};

export default BackToDashboardButton; 