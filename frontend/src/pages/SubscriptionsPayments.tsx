import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface PaymentHistory {
  id: string;
  date: string;
  amount: string;
  status: 'Successful' | 'Failed' | 'Refunded';
  method: string;
}

interface Seller {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Premium';
  subscriptionStartDate: string;
  paymentStatus: 'Active' | 'Failed' | 'Canceled';
  nextBillingDate: string;
  paymentHistory: PaymentHistory[];
}

type SortField = 'id' | 'name' | 'subscriptionTier' | 'paymentStatus' | 'nextBillingDate';
type SortDirection = 'asc' | 'desc';

interface PaymentHistoryModalProps {
  seller: Seller | null;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ seller, isOpen, onClose }) => {
  if (!isOpen || !seller) return null;
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Successful':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Refunded':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Payment History: {seller.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Seller Information</h3>
              <p><span className="font-medium">ID:</span> {seller.id}</p>
              <p><span className="font-medium">Name:</span> {seller.name}</p>
              <p><span className="font-medium">Email:</span> {seller.email}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Subscription Details</h3>
              <p>
                <span className="font-medium">Tier:</span> 
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  seller.subscriptionTier === 'Premium' ? 'bg-purple-100 text-purple-800' : 
                  seller.subscriptionTier === 'Pro' ? 'bg-blue-100 text-blue-800' :
                  seller.subscriptionTier === 'Starter' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>{seller.subscriptionTier}</span>
              </p>
              <p><span className="font-medium">Start Date:</span> {seller.subscriptionStartDate}</p>
              <p><span className="font-medium">Next Billing:</span> {seller.nextBillingDate}</p>
              <p>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  seller.paymentStatus === 'Active' ? 'bg-green-100 text-green-800' : 
                  seller.paymentStatus === 'Failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>{seller.paymentStatus}</span>
              </p>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-3">Payment History</h3>
          
          {seller.paymentHistory.length === 0 ? (
            <p className="text-gray-500 italic">No payment history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {seller.paymentHistory.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{payment.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{payment.date}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{payment.amount}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{payment.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SubscriptionsPayments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewingSeller, setViewingSeller] = useState<Seller | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock sellers data
  const [sellers] = useState<Seller[]>([
    {
      id: "SLR-1001",
      name: "Premium Cards Shop",
      email: "premium@cards.com",
      subscriptionTier: "Premium",
      subscriptionStartDate: "2023-01-15",
      paymentStatus: "Active",
      nextBillingDate: "2023-08-15",
      paymentHistory: [
        {
          id: "PAY-1001",
          date: "2023-07-15",
          amount: "$49.99",
          status: "Successful",
          method: "Visa ending in 4242"
        },
        {
          id: "PAY-0967",
          date: "2023-06-15",
          amount: "$49.99",
          status: "Successful",
          method: "Visa ending in 4242"
        },
        {
          id: "PAY-0832",
          date: "2023-05-15",
          amount: "$49.99",
          status: "Successful",
          method: "Visa ending in 4242"
        }
      ]
    },
    {
      id: "SLR-1002",
      name: "Vintage Collections",
      email: "info@vintage.com",
      subscriptionTier: "Pro",
      subscriptionStartDate: "2023-02-20",
      paymentStatus: "Active",
      nextBillingDate: "2023-08-20",
      paymentHistory: [
        {
          id: "PAY-1053",
          date: "2023-07-20",
          amount: "$29.99",
          status: "Successful",
          method: "Mastercard ending in 1234"
        },
        {
          id: "PAY-0989",
          date: "2023-06-20",
          amount: "$29.99",
          status: "Successful",
          method: "Mastercard ending in 1234"
        }
      ]
    },
    {
      id: "SLR-1003",
      name: "Trading Card Masters",
      email: "sales@tcmasters.com",
      subscriptionTier: "Starter",
      subscriptionStartDate: "2023-03-10",
      paymentStatus: "Failed",
      nextBillingDate: "2023-07-10",
      paymentHistory: [
        {
          id: "PAY-1078",
          date: "2023-07-10",
          amount: "$9.99",
          status: "Failed",
          method: "Mastercard ending in 5678"
        },
        {
          id: "PAY-1005",
          date: "2023-06-10",
          amount: "$9.99",
          status: "Successful",
          method: "Mastercard ending in 5678"
        }
      ]
    },
    {
      id: "SLR-1004",
      name: "Rare Finds Store",
      email: "contact@rarefinds.com",
      subscriptionTier: "Free",
      subscriptionStartDate: "2023-04-05",
      paymentStatus: "Active",
      nextBillingDate: "-",
      paymentHistory: []
    },
    {
      id: "SLR-1005",
      name: "Collector's Heaven",
      email: "support@collectorsheaven.com",
      subscriptionTier: "Premium",
      subscriptionStartDate: "2023-01-22",
      paymentStatus: "Canceled",
      nextBillingDate: "-",
      paymentHistory: [
        {
          id: "PAY-0978",
          date: "2023-06-22",
          amount: "$49.99",
          status: "Successful",
          method: "American Express ending in 2468"
        },
        {
          id: "PAY-0845",
          date: "2023-05-22",
          amount: "$49.99",
          status: "Successful",
          method: "American Express ending in 2468"
        },
        {
          id: "PAY-0921",
          date: "2023-07-04",
          amount: "$49.99",
          status: "Refunded",
          method: "American Express ending in 2468"
        }
      ]
    }
  ]);
  
  // Filter and sort sellers
  const filteredAndSortedSellers = [...sellers]
    .filter(seller => 
      (selectedTier === 'All' || seller.subscriptionTier === selectedTier) &&
      (selectedStatus === 'All' || seller.paymentStatus === selectedStatus) &&
      (seller.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       seller.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleViewDetails = (seller: Seller) => {
    setViewingSeller(seller);
    setIsModalOpen(true);
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 inline ml-1" />
      : <ArrowDownIcon className="h-4 w-4 inline ml-1" />;
  };
  
  const getSubscriptionClass = (tier: string) => {
    switch (tier) {
      case 'Premium':
        return 'bg-purple-100 text-purple-800';
      case 'Pro':
        return 'bg-blue-100 text-blue-800';
      case 'Starter':
        return 'bg-green-100 text-green-800';
      case 'Free':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Subscriptions & Payments</h1>
        <p className="text-gray-600 mt-1">Manage seller subscriptions and payment information</p>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search sellers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div>
            <span className="text-sm font-medium text-gray-700 mr-2">Subscription:</span>
            <select 
              className="border border-gray-300 rounded-md text-sm p-2"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
            >
              <option value="All">All Tiers</option>
              <option value="Free">Free</option>
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
            <select 
              className="border border-gray-300 rounded-md text-sm p-2"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Failed">Failed</option>
              <option value="Canceled">Canceled</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  Seller ID {renderSortIcon('id')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name {renderSortIcon('name')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('subscriptionTier')}
                >
                  Subscription Tier {renderSortIcon('subscriptionTier')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('paymentStatus')}
                >
                  Payment Status {renderSortIcon('paymentStatus')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('nextBillingDate')}
                >
                  Next Billing Date {renderSortIcon('nextBillingDate')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedSellers.map((seller) => (
                <tr key={seller.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{seller.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                    <div className="text-xs text-gray-500">{seller.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubscriptionClass(seller.subscriptionTier)}`}>
                      {seller.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(seller.paymentStatus)}`}>
                      {seller.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {seller.nextBillingDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewDetails(seller)}
                      className="inline-flex items-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-1 px-3 rounded text-xs"
                    >
                      <EyeIcon className="h-3.5 w-3.5 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <PaymentHistoryModal 
        seller={viewingSeller}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </AdminLayout>
  );
};

export default SubscriptionsPayments; 