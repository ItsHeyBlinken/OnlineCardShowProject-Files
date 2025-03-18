import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dateSubmitted: string;
  lastUpdated: string;
  category: string;
  attachments: Attachment[];
}

type SortField = 'id' | 'userName' | 'subject' | 'status' | 'dateSubmitted' | 'priority';
type SortDirection = 'asc' | 'desc';

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (ticketId: string, newStatus: 'Open' | 'In Progress' | 'Closed') => void;
}

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ 
  ticket, 
  isOpen, 
  onClose,
  onStatusChange 
}) => {
  const [replyText, setReplyText] = useState('');
  
  if (!isOpen || !ticket) return null;
  
  const handleReply = () => {
    // In a real app, this would send the reply to an API
    console.log(`Replying to ticket ${ticket.id} with: ${replyText}`);
    setReplyText('');
    // Optionally update status to In Progress
    onStatusChange(ticket.id, 'In Progress');
  };
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
      default:
        return 'bg-green-100 text-green-800';
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2 pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Ticket #{ticket.id}</h2>
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
              <h3 className="text-lg font-medium mb-2">User Information</h3>
              <p><span className="font-medium">Name:</span> {ticket.userName}</p>
              <p><span className="font-medium">Email:</span> {ticket.userEmail}</p>
              <p><span className="font-medium">User ID:</span> {ticket.userId}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Ticket Details</h3>
              <p>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(ticket.status)}`}>
                  {ticket.status}
                </span>
              </p>
              <p>
                <span className="font-medium">Priority:</span> 
                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </p>
              <p><span className="font-medium">Category:</span> {ticket.category}</p>
              <p><span className="font-medium">Submitted:</span> {ticket.dateSubmitted}</p>
              <p><span className="font-medium">Last Updated:</span> {ticket.lastUpdated}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Issue</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-2">
              <h4 className="font-medium text-gray-800 mb-2">{ticket.subject}</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
            </div>
          </div>
          
          {ticket.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Attachments</h3>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map(attachment => (
                  <a 
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center bg-gray-100 px-3 py-2 rounded-md text-sm hover:bg-gray-200"
                  >
                    <span className="mr-2">📎</span>
                    {attachment.name}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Reply</h3>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[100px] focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            ></textarea>
          </div>
          
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleReply}
                disabled={!replyText.trim()}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  replyText.trim() 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                Reply
              </button>
              
              <button 
                onClick={() => onStatusChange(ticket.id, 'Closed')}
                className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Close Ticket
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {ticket.status !== 'In Progress' && (
                <button 
                  onClick={() => onStatusChange(ticket.id, 'In Progress')}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Mark as In Progress
                </button>
              )}
              
              <button 
                className="flex items-center bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-600"
              >
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                Escalate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SupportTickets = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('dateSubmitted');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock tickets data
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: "TKT-1001",
      userId: "USR-2201",
      userName: "John Smith",
      userEmail: "john@example.com",
      subject: "Unable to complete checkout process",
      message: "I've been trying to complete a purchase of baseball cards, but when I reach the payment screen, I get an error message saying 'Transaction cannot be processed'. I've tried different cards and even PayPal, but nothing works.\n\nCan you please help me resolve this? I really want to complete this purchase.",
      status: "Open",
      priority: "High",
      dateSubmitted: "2023-07-15 14:32",
      lastUpdated: "2023-07-15 14:32",
      category: "Payment Issues",
      attachments: [
        {
          id: "ATT-101",
          name: "checkout_error.png",
          type: "image/png",
          url: "#"
        }
      ]
    },
    {
      id: "TKT-1002",
      userId: "USR-1548",
      userName: "Sarah Jones",
      userEmail: "sarah@example.com",
      subject: "Request for refund",
      message: "I received my order yesterday (Order #ORD-8873), but the cards were not in the condition described. The corners are damaged and there are visible scratches on several of the cards.\n\nI'd like to request a refund as the items are not as described in the listing.",
      status: "In Progress",
      priority: "Medium",
      dateSubmitted: "2023-07-13 09:15",
      lastUpdated: "2023-07-14 11:22",
      category: "Refund Request",
      attachments: [
        {
          id: "ATT-201",
          name: "damaged_card1.jpg",
          type: "image/jpeg",
          url: "#"
        },
        {
          id: "ATT-202",
          name: "damaged_card2.jpg",
          type: "image/jpeg",
          url: "#"
        }
      ]
    },
    {
      id: "TKT-1003",
      userId: "USR-9987",
      userName: "Mike Johnson",
      userEmail: "mike@example.com",
      subject: "Question about seller fees",
      message: "I'm considering upgrading my seller account to the Pro tier, but I'm unclear about the transaction fees. Does the 5% fee apply to the total transaction including shipping, or just the item price?\n\nAlso, are there any additional fees I should be aware of?",
      status: "Closed",
      priority: "Low",
      dateSubmitted: "2023-07-10 15:47",
      lastUpdated: "2023-07-12 10:33",
      category: "Seller Inquiry",
      attachments: []
    },
    {
      id: "TKT-1004",
      userId: "USR-3301",
      userName: "Emily Wilson",
      userEmail: "emily@example.com",
      subject: "Missing item in shipment",
      message: "I received my order today (Order #ORD-7752), but one of the items is missing. I ordered 5 different cards, but only received 4 in the package.\n\nThe missing card is a 2021 Topps Gold Label Class 2 #15 which was listed at $18.99. Please advise on how to resolve this issue.",
      status: "Open",
      priority: "Urgent",
      dateSubmitted: "2023-07-14 16:22",
      lastUpdated: "2023-07-14 16:22",
      category: "Order Issues",
      attachments: [
        {
          id: "ATT-301",
          name: "packing_slip.pdf",
          type: "application/pdf",
          url: "#"
        }
      ]
    },
    {
      id: "TKT-1005",
      userId: "USR-4488",
      userName: "Robert Chen",
      userEmail: "robert@example.com",
      subject: "Account verification problems",
      message: "I've been trying to verify my account for the past week but keep receiving an error. I've uploaded my ID as requested, but the verification never completes. This is preventing me from listing my cards for sale.\n\nI've already tried different browsers and devices, but still have the same issue.",
      status: "In Progress",
      priority: "High",
      dateSubmitted: "2023-07-12 11:08",
      lastUpdated: "2023-07-13 14:15",
      category: "Account Issues",
      attachments: []
    }
  ]);
  
  // Filter and sort tickets
  const filteredAndSortedTickets = [...tickets]
    .filter(ticket => 
      (selectedStatus === 'All' || ticket.status === selectedStatus) &&
      (ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()))
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
  
  const handleViewDetails = (ticket: Ticket) => {
    setViewingTicket(ticket);
    setIsModalOpen(true);
  };
  
  const handleStatusChange = (ticketId: string, newStatus: 'Open' | 'In Progress' | 'Closed') => {
    const updatedTickets = tickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus, lastUpdated: new Date().toLocaleString() } 
        : ticket
    );
    setTickets(updatedTickets);
    
    // Update viewing ticket if it's currently being viewed
    if (viewingTicket && viewingTicket.id === ticketId) {
      setViewingTicket({ ...viewingTicket, status: newStatus, lastUpdated: new Date().toLocaleString() });
    }
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 inline ml-1" />
      : <ArrowDownIcon className="h-4 w-4 inline ml-1" />;
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Support Tickets</h1>
        <p className="text-gray-600 mt-1">Manage and respond to customer support tickets</p>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div>
            <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
            <select 
              className="border border-gray-300 rounded-md text-sm p-2"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
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
                  Ticket ID {renderSortIcon('id')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('userName')}
                >
                  User {renderSortIcon('userName')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('subject')}
                >
                  Issue Summary {renderSortIcon('subject')}
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
                  onClick={() => handleSort('priority')}
                >
                  Priority {renderSortIcon('priority')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('dateSubmitted')}
                >
                  Date Submitted {renderSortIcon('dateSubmitted')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.userName}</div>
                    <div className="text-xs text-gray-500">{ticket.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{ticket.subject}</div>
                    <div className="text-xs text-gray-500">{ticket.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.dateSubmitted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewDetails(ticket)}
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
      
      <TicketDetailsModal 
        ticket={viewingTicket}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </AdminLayout>
  );
};

export default SupportTickets; 