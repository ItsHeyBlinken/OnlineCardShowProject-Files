import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Listing {
  id: string;
  seller: string;
  sellerEmail: string;
  title: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  condition: string;
  reasonFlagged: string;
  status: 'Pending Review' | 'Approved' | 'Removed';
  dateFlagged: string;
  flaggedBy: string;
}

type SortField = 'id' | 'seller' | 'title' | 'reasonFlagged' | 'status' | 'dateFlagged';
type SortDirection = 'asc' | 'desc';

interface ListingDetailsModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onRemove: (id: string) => void;
}

const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({ 
  listing, 
  isOpen, 
  onClose,
  onApprove,
  onRemove 
}) => {
  if (!isOpen || !listing) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Listing Details: {listing.id}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {listing.images.map((image, index) => (
              <div key={index} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-1">
                <img 
                  src={image} 
                  alt={`${listing.title} - Image ${index + 1}`} 
                  className="w-full h-48 object-cover rounded-md shadow-sm"
                />
              </div>
            ))}
          </div>
          
          <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-xl text-indigo-600">{listing.price}</span>
            <span className="text-sm text-gray-500">Condition: {listing.condition}</span>
          </div>
          
          <div className="mb-4">
            <h4 className="text-lg font-medium mb-2">Description</h4>
            <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-lg font-medium mb-2">Seller Information</h4>
              <p><span className="font-medium">Name:</span> {listing.seller}</p>
              <p><span className="font-medium">Email:</span> {listing.sellerEmail}</p>
              <p><span className="font-medium">Category:</span> {listing.category}</p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Flagged Information</h4>
              <p><span className="font-medium">Reason:</span> {listing.reasonFlagged}</p>
              <p><span className="font-medium">Date Flagged:</span> {listing.dateFlagged}</p>
              <p><span className="font-medium">Flagged By:</span> {listing.flaggedBy}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  listing.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                  listing.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>{listing.status}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 border-t pt-4">
          <button
            onClick={() => {
              onRemove(listing.id);
              onClose();
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center"
            disabled={listing.status === 'Removed'}
          >
            <XMarkIcon className="h-5 w-5 mr-1" />
            Remove Listing
          </button>
          <button
            onClick={() => {
              onApprove(listing.id);
              onClose();
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
            disabled={listing.status === 'Approved'}
          >
            <CheckIcon className="h-5 w-5 mr-1" />
            Approve Listing
          </button>
        </div>
      </div>
    </div>
  );
};

const ListingModeration = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('dateFlagged');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewingListing, setViewingListing] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock listings data
  const [listings, setListings] = useState<Listing[]>([
    {
      id: 'LST-1001',
      seller: 'Premium Cards Shop',
      sellerEmail: 'premium@cards.com',
      title: 'Charizard Holo 1st Edition',
      description: 'Rare 1st edition Charizard holographic card in mint condition. This is one of the most sought-after cards in the Pokémon TCG.',
      price: '$12,999.99',
      images: [
        'https://m.media-amazon.com/images/I/51ePeUy7S-L.jpg',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkYw-8Z9edQ9-9REw4UgfTyUjgQ1BMdwXHIQ&usqp=CAU',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTILnv-IReyjZKEEXdyZ5G1WcrzEDFnSsI-w&usqp=CAU'
      ],
      category: 'Pokémon TCG',
      condition: 'Mint',
      reasonFlagged: 'Potential counterfeit item based on price and rarity',
      status: 'Pending Review',
      dateFlagged: '2023-07-20',
      flaggedBy: 'System (Automated Detection)'
    },
    {
      id: 'LST-1002',
      seller: 'Vintage Collections',
      sellerEmail: 'info@vintage.com',
      title: 'Black Lotus MTG Alpha',
      description: 'Alpha Black Lotus from Magic: The Gathering. Original 1993 release in good condition with some edge wear.',
      price: '$45,000.00',
      images: [
        'https://product-images.tcgplayer.com/fit-in/437x437/1534.jpg',
        'https://product-images.tcgplayer.com/fit-in/437x437/220265.jpg'
      ],
      category: 'Magic: The Gathering',
      condition: 'Good',
      reasonFlagged: 'Extremely high value item - authentication required',
      status: 'Pending Review',
      dateFlagged: '2023-07-18',
      flaggedBy: 'Admin User (Manual)'
    },
    {
      id: 'LST-1003',
      seller: 'Trading Card Masters',
      sellerEmail: 'sales@tcmasters.com',
      title: 'Banned Yu-Gi-Oh Card Set',
      description: 'Complete set of internationally banned Yu-Gi-Oh cards. Includes all restricted tournament cards from 2005-2023.',
      price: '$899.99',
      images: [
        'https://ms.yugipedia.com//thumb/1/18/ChangeofHeart-LCYW-EN-ScR-1E.png/300px-ChangeofHeart-LCYW-EN-ScR-1E.png',
        'https://static.wikia.nocookie.net/yugioh/images/3/37/PotofGreed-LC03-EN-UR-LE.png'
      ],
      category: 'Yu-Gi-Oh',
      condition: 'Near Mint',
      reasonFlagged: 'Potentially illegal items - requires review',
      status: 'Removed',
      dateFlagged: '2023-07-15',
      flaggedBy: 'User Report (username: cardcollector42)'
    },
    {
      id: 'LST-1004',
      seller: 'Card Kingdom',
      sellerEmail: 'support@cardkingdom.com',
      title: 'Baseball Card Mystery Box',
      description: 'Mystery box containing vintage baseball cards from the 1950s-1990s. At least one guaranteed rookie card.',
      price: '$199.99',
      images: [
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMQOCBwvZiqV6L4XY6OY3xIucJigQZM_8CzA&usqp=CAU',
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdLTZpW3a3Jz0rHm4wKHnL2PBGfM4BoNEtRw&usqp=CAU'
      ],
      category: 'Sports Cards',
      condition: 'Various',
      reasonFlagged: 'Gambling-like mechanics - mystery boxes policy review',
      status: 'Approved',
      dateFlagged: '2023-07-10',
      flaggedBy: 'System (Policy Compliance)'
    },
    {
      id: 'LST-1005',
      seller: 'Rare Finds Store',
      sellerEmail: 'contact@rarefinds.com',
      title: 'Inappropriate Custom Card Set',
      description: 'Custom designed adult-themed parody trading cards with NSFW content.',
      price: '$59.99',
      images: [
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4Y5_0PHklmOqTSNIY6k_9xYvjm-ZlJ-iIwA&usqp=CAU'
      ],
      category: 'Custom Cards',
      condition: 'New',
      reasonFlagged: 'NSFW content - violates content policy',
      status: 'Removed',
      dateFlagged: '2023-07-08',
      flaggedBy: 'User Report (multiple reports)'
    }
  ]);
  
  // Filter and sort listings
  const filteredAndSortedListings = [...listings]
    .filter(listing => 
      (selectedStatus === 'All' || listing.status === selectedStatus) &&
      (listing.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       listing.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
       listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       listing.reasonFlagged.toLowerCase().includes(searchTerm.toLowerCase()))
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
  
  const handleViewDetails = (listing: Listing) => {
    setViewingListing(listing);
    setIsModalOpen(true);
  };
  
  const handleApproveListing = (id: string) => {
    const updatedListings = listings.map(listing => 
      listing.id === id ? { ...listing, status: 'Approved' as const } : listing
    );
    setListings(updatedListings);
  };
  
  const handleRemoveListing = (id: string) => {
    const updatedListings = listings.map(listing => 
      listing.id === id ? { ...listing, status: 'Removed' as const } : listing
    );
    setListings(updatedListings);
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 inline ml-1" />
      : <ArrowDownIcon className="h-4 w-4 inline ml-1" />;
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Removed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Listing Moderation</h1>
        <p className="text-gray-600 mt-1">Review and moderate flagged listings</p>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
            {['All', 'Pending Review', 'Approved', 'Removed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
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
                  Listing ID {renderSortIcon('id')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('seller')}
                >
                  Seller {renderSortIcon('seller')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  Title {renderSortIcon('title')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('reasonFlagged')}
                >
                  Reason Flagged {renderSortIcon('reasonFlagged')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  Status {renderSortIcon('status')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('dateFlagged')}
                >
                  Date Flagged {renderSortIcon('dateFlagged')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedListings.map((listing) => (
                <tr key={listing.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{listing.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{listing.seller}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{listing.title}</div>
                    <div className="text-xs text-gray-500">{listing.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{listing.reasonFlagged}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(listing.status)}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {listing.dateFlagged}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewDetails(listing)}
                        className="inline-flex items-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-1 px-2.5 rounded text-xs"
                      >
                        <EyeIcon className="h-3.5 w-3.5 mr-1" />
                        View
                      </button>
                      {listing.status !== 'Approved' && (
                        <button 
                          onClick={() => handleApproveListing(listing.id)}
                          className="inline-flex items-center bg-green-100 hover:bg-green-200 text-green-700 font-medium py-1 px-2.5 rounded text-xs"
                        >
                          <CheckIcon className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </button>
                      )}
                      {listing.status !== 'Removed' && (
                        <button 
                          onClick={() => handleRemoveListing(listing.id)}
                          className="inline-flex items-center bg-red-100 hover:bg-red-200 text-red-700 font-medium py-1 px-2.5 rounded text-xs"
                        >
                          <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <ListingDetailsModal 
        listing={viewingListing}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={handleApproveListing}
        onRemove={handleRemoveListing}
      />
    </AdminLayout>
  );
};

export default ListingModeration; 