import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  price: string;
  quantity: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface TimelineEvent {
  date: string;
  status: string;
  note?: string;
}

interface Order {
  id: string;
  buyer: string;
  buyerEmail: string;
  seller: string;
  sellerEmail: string;
  totalAmount: string;
  status: 'Pending' | 'Shipped' | 'Completed' | 'Canceled';
  orderDate: string;
  products: Product[];
  shippingAddress: Address;
  timeline: TimelineEvent[];
}

type SortField = 'id' | 'buyer' | 'seller' | 'totalAmount' | 'status' | 'orderDate';
type SortDirection = 'asc' | 'desc';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Order Details: {order.id}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Customer Information</h3>
            <p><span className="font-medium">Name:</span> {order.buyer}</p>
            <p><span className="font-medium">Email:</span> {order.buyerEmail}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Seller Information</h3>
            <p><span className="font-medium">Name:</span> {order.seller}</p>
            <p><span className="font-medium">Email:</span> {order.sellerEmail}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Order Summary</h3>
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex justify-between mb-2">
              <span>Order Date:</span>
              <span>{order.orderDate}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Status:</span>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>{order.status}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{order.totalAmount}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{product.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{product.price}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{product.quantity}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                      ${(parseFloat(product.price.replace('$', '')) * product.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Shipping Address</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Order Timeline</h3>
          <div className="space-y-4">
            {order.timeline.map((event, index) => (
              <div key={index} className="relative pl-8 pb-4">
                <div className="absolute left-0 top-0 h-full">
                  <div className="h-full w-0.5 bg-gray-200"></div>
                </div>
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-indigo-500"></div>
                <div>
                  <p className="text-sm text-gray-500">{event.date}</p>
                  <p className="font-medium">{event.status}</p>
                  {event.note && <p className="text-sm text-gray-600 mt-1">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock orders data
  const [orders] = useState<Order[]>([
    {
      id: 'ORD-1001',
      buyer: 'John Doe',
      buyerEmail: 'john@example.com',
      seller: 'Premium Cards Shop',
      sellerEmail: 'premium@cards.com',
      totalAmount: '$149.99',
      status: 'Completed',
      orderDate: '2023-07-15',
      products: [
        { id: 1, name: 'Charizard Holo 1st Edition', price: '$99.99', quantity: 1 },
        { id: 2, name: 'Card Sleeves (Pack of 100)', price: '$9.99', quantity: 5 }
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'USA'
      },
      timeline: [
        { date: '2023-07-15 09:30 AM', status: 'Order Placed' },
        { date: '2023-07-15 10:15 AM', status: 'Payment Confirmed' },
        { date: '2023-07-15 02:45 PM', status: 'Processing' },
        { date: '2023-07-16 11:20 AM', status: 'Shipped', note: 'Tracking number: USPS1234567890' },
        { date: '2023-07-19 03:15 PM', status: 'Delivered' },
        { date: '2023-07-20 09:45 AM', status: 'Completed' }
      ]
    },
    {
      id: 'ORD-1002',
      buyer: 'Jane Smith',
      buyerEmail: 'jane@example.com',
      seller: 'Vintage Collections',
      sellerEmail: 'info@vintage.com',
      totalAmount: '$85.50',
      status: 'Shipped',
      orderDate: '2023-07-18',
      products: [
        { id: 3, name: 'Pikachu Promo Card', price: '$45.50', quantity: 1 },
        { id: 4, name: 'Card Display Case', price: '$20.00', quantity: 2 }
      ],
      shippingAddress: {
        street: '456 Oak Avenue',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA'
      },
      timeline: [
        { date: '2023-07-18 02:30 PM', status: 'Order Placed' },
        { date: '2023-07-18 02:45 PM', status: 'Payment Confirmed' },
        { date: '2023-07-19 10:30 AM', status: 'Processing' },
        { date: '2023-07-20 09:15 AM', status: 'Shipped', note: 'Tracking number: FEDEX7654321' }
      ]
    },
    {
      id: 'ORD-1003',
      buyer: 'Bob Johnson',
      buyerEmail: 'bob@example.com',
      seller: 'Trading Card Masters',
      sellerEmail: 'sales@tcmasters.com',
      totalAmount: '$299.95',
      status: 'Pending',
      orderDate: '2023-07-20',
      products: [
        { id: 5, name: 'Collector\'s Box Set', price: '$249.95', quantity: 1 },
        { id: 6, name: 'Premium Card Album', price: '$49.99', quantity: 1 }
      ],
      shippingAddress: {
        street: '789 Pine Street',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        country: 'USA'
      },
      timeline: [
        { date: '2023-07-20 05:15 PM', status: 'Order Placed' },
        { date: '2023-07-20 05:30 PM', status: 'Payment Confirmed' },
        { date: '2023-07-20 06:00 PM', status: 'Processing' }
      ]
    },
    {
      id: 'ORD-1004',
      buyer: 'Alice Brown',
      buyerEmail: 'alice@example.com',
      seller: 'Rare Finds Store',
      sellerEmail: 'contact@rarefinds.com',
      totalAmount: '$75.00',
      status: 'Canceled',
      orderDate: '2023-07-10',
      products: [
        { id: 7, name: 'Vintage Booster Pack', price: '$75.00', quantity: 1 }
      ],
      shippingAddress: {
        street: '321 Maple Drive',
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
        country: 'USA'
      },
      timeline: [
        { date: '2023-07-10 10:45 AM', status: 'Order Placed' },
        { date: '2023-07-10 11:00 AM', status: 'Payment Confirmed' },
        { date: '2023-07-11 09:30 AM', status: 'Processing' },
        { date: '2023-07-12 02:15 PM', status: 'Canceled', note: 'Canceled by customer: Item no longer needed' }
      ]
    },
    {
      id: 'ORD-1005',
      buyer: 'Charlie Wilson',
      buyerEmail: 'charlie@example.com',
      seller: 'Collector\'s Heaven',
      sellerEmail: 'support@collectorsheaven.com',
      totalAmount: '$199.99',
      status: 'Completed',
      orderDate: '2023-07-05',
      products: [
        { id: 8, name: 'Rare Holographic Card', price: '$149.99', quantity: 1 },
        { id: 9, name: 'Trading Card Protection Kit', price: '$24.99', quantity: 2 }
      ],
      shippingAddress: {
        street: '555 Cedar Lane',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
        country: 'USA'
      },
      timeline: [
        { date: '2023-07-05 03:30 PM', status: 'Order Placed' },
        { date: '2023-07-05 03:45 PM', status: 'Payment Confirmed' },
        { date: '2023-07-06 10:20 AM', status: 'Processing' },
        { date: '2023-07-07 11:10 AM', status: 'Shipped', note: 'Tracking number: DHL9876543' },
        { date: '2023-07-09 02:35 PM', status: 'Delivered' },
        { date: '2023-07-10 09:00 AM', status: 'Completed' }
      ]
    }
  ]);
  
  // Filter and sort orders
  const filteredAndSortedOrders = [...orders]
    .filter(order => 
      (selectedStatus === 'All' || order.status === selectedStatus) &&
      (order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       order.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
       order.seller.toLowerCase().includes(searchTerm.toLowerCase()))
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
  
  const handleViewDetails = (order: Order) => {
    setViewingOrder(order);
    setIsModalOpen(true);
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 inline ml-1" />
      : <ArrowDownIcon className="h-4 w-4 inline ml-1" />;
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
        <p className="text-gray-600 mt-1">View and manage customer orders</p>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
            {['All', 'Pending', 'Shipped', 'Completed', 'Canceled'].map((status) => (
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
                  Order ID {renderSortIcon('id')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('buyer')}
                >
                  Buyer {renderSortIcon('buyer')}
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
                  onClick={() => handleSort('totalAmount')}
                >
                  Total Amount {renderSortIcon('totalAmount')}
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
                  onClick={() => handleSort('orderDate')}
                >
                  Order Date {renderSortIcon('orderDate')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.buyer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.seller}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {order.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.orderDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewDetails(order)}
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
      
      <OrderDetailsModal 
        order={viewingOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </AdminLayout>
  );
};

export default OrderManagement; 