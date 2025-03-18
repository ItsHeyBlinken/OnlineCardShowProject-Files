import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  dateSubmitted: string;
  lastUpdated: string;
  attachments: Attachment[];
}

type SortField = 'id' | 'userName' | 'subject' | 'status' | 'dateSubmitted' | 'priority';
type SortDirection = 'asc' | 'desc';

interface TicketDetailsModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (ticketId: string, newStatus: string) => void;
}

// Mock data for development
const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "T1001",
    userId: "U5001",
    userName: "John Smith",
    userEmail: "john.smith@example.com",
    subject: "Unable to add items to cart",
    message: "Every time I try to add a card to my cart, I get an error message saying 'Operation failed'. This has been happening since yesterday.",
    category: "Store Issues",
    priority: "High",
    status: "Open",
    dateSubmitted: "2023-11-15T10:30:00Z",
    lastUpdated: "2023-11-15T10:30:00Z",
    attachments: [
      {
        id: "A001",
        name: "error_screenshot.png",
        url: "/uploads/error_screenshot.png",
        size: 1024000,
        type: "image/png"
      }
    ]
  },
  {
    id: "T1002",
    userId: "U3045",
    userName: "Emily Johnson",
    userEmail: "emily.j@example.com",
    subject: "Payment failed but money deducted",
    message: "I tried to purchase a card but got an error at checkout. The money was deducted from my account but I didn't receive any confirmation and the card isn't in my collection.",
    category: "Payment Issues",
    priority: "Urgent",
    status: "In Progress",
    dateSubmitted: "2023-11-14T16:45:00Z",
    lastUpdated: "2023-11-15T09:20:00Z",
    attachments: [
      {
        id: "A002",
        name: "payment_receipt.pdf",
        url: "/uploads/payment_receipt.pdf",
        size: 512000,
        type: "application/pdf"
      }
    ]
  },
  {
    id: "T1003",
    userId: "U1978",
    userName: "Michael Brown",
    userEmail: "m.brown@example.com",
    subject: "Request to cancel subscription",
    message: "I would like to cancel my premium subscription. Please provide instructions on how to do this.",
    category: "Subscription",
    priority: "Medium",
    status: "Closed",
    dateSubmitted: "2023-11-10T12:15:00Z",
    lastUpdated: "2023-11-12T14:30:00Z",
    attachments: []
  },
  {
    id: "T1004",
    userId: "U4210",
    userName: "Sarah Wilson",
    userEmail: "sarah.w@example.com",
    subject: "Card quality issue",
    message: "I received my limited edition card today, but it has scratches on the front. I've attached photos of the damage. Can I get a replacement?",
    category: "Product Quality",
    priority: "Medium",
    status: "Open",
    dateSubmitted: "2023-11-14T09:50:00Z",
    lastUpdated: "2023-11-14T09:50:00Z",
    attachments: [
      {
        id: "A003",
        name: "damage_photo_1.jpg",
        url: "/uploads/damage_photo_1.jpg",
        size: 2048000,
        type: "image/jpeg"
      },
      {
        id: "A004",
        name: "damage_photo_2.jpg",
        url: "/uploads/damage_photo_2.jpg",
        size: 1536000, 
        type: "image/jpeg"
      }
    ]
  },
  {
    id: "T1005",
    userId: "U6532",
    userName: "David Chen",
    userEmail: "d.chen@example.com",
    subject: "Feature request: Card statistics",
    message: "It would be great if you could add a feature to track the performance statistics of cards in matches. This would help collectors understand the value of their cards better.",
    category: "Feature Request",
    priority: "Low",
    status: "Open",
    dateSubmitted: "2023-11-13T15:20:00Z",
    lastUpdated: "2023-11-13T15:20:00Z",
    attachments: []
  }
];

const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({ 
  ticket, 
  isOpen, 
  onClose,
  onStatusChange 
}) => {
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  if (!isOpen || !ticket) return null;
  
  const handleReply = async () => {
    // Validate input
    if (!replyText.trim()) return;
    
    try {
      setSendingReply(true);
      
      // In a real app, this would send the reply to an API
      // await axios.post(`/api/support-tickets/${ticket.id}/replies`, { message: replyText });
      console.log(`Replying to ticket ${ticket.id} with: ${replyText}`);
      
      // Optionally update status to In Progress
      if (ticket.status === 'Open') {
        onStatusChange(ticket.id, 'In Progress');
      }
      
      // Clear reply text
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSendingReply(false);
    }
  };
  
  const handleDownloadAttachment = (attachment: Attachment) => {
    // Open attachment in new tab or download it
    window.open(attachment.url, '_blank');
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
              <p><span className="font-medium">Submitted:</span> {new Date(ticket.dateSubmitted).toLocaleString()}</p>
              <p><span className="font-medium">Last Updated:</span> {new Date(ticket.lastUpdated).toLocaleString()}</p>
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
                  <button 
                    key={attachment.id}
                    onClick={() => handleDownloadAttachment(attachment)}
                    className="flex items-center bg-gray-100 px-3 py-2 rounded-md text-sm hover:bg-gray-200"
                  >
                    <span className="mr-2">📎</span>
                    {attachment.name}
                  </button>
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
              disabled={ticket.status === 'Closed'}
            ></textarea>
            {ticket.status === 'Closed' && (
              <p className="text-sm text-gray-500 mt-1">This ticket is closed. Reopen it to reply.</p>
            )}
          </div>
          
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleReply}
                disabled={!replyText.trim() || ticket.status === 'Closed' || sendingReply}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  replyText.trim() && ticket.status !== 'Closed' && !sendingReply
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                {sendingReply ? 'Sending...' : 'Reply'}
              </button>
              
              {ticket.status !== 'Closed' && (
                <button 
                  onClick={() => onStatusChange(ticket.id, 'Closed')}
                  className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Close Ticket
                </button>
              )}
              
              {ticket.status === 'Closed' && (
                <button 
                  onClick={() => onStatusChange(ticket.id, 'Open')}
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Reopen Ticket
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {ticket.status !== 'In Progress' && ticket.status !== 'Closed' && (
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
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  
  // Fetch tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters for filtering
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (priorityFilter !== 'All') params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`/api/support-tickets?${params.toString()}`);
      setTickets(response.data.tickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load support tickets. Please try again later.');
      // Fall back to mock data in development
      if (process.env.NODE_ENV === 'development') {
        setTickets(MOCK_TICKETS);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]); // Re-fetch when filters change
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };
  
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await axios.patch(`/api/support-tickets/${ticketId}/status`, { 
        status: newStatus 
      });
      
      // Update local state
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus, lastUpdated: new Date().toISOString() } 
          : ticket
      ));
      
      // Update selected ticket if modal is open
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({
          ...selectedTicket,
          status: newStatus,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      alert('Failed to update ticket status. Please try again.');
    }
  };
  
  const openTicketDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };
  
  const closeTicketDetails = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };
  
  // Filter tickets based on search term client-side (for immediate feedback)
  const filteredTickets = tickets.filter(ticket => {
    const searchFields = [
      ticket.id,
      ticket.userName,
      ticket.userEmail,
      ticket.subject,
      ticket.message,
      ticket.category
    ].map(field => field.toLowerCase());
    
    return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
  });
  
  // Helper functions for styling
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 mr-2">Priority:</span>
            <select 
              className="border border-gray-300 rounded-md text-sm p-2"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <button 
              onClick={fetchTickets}
              className="bg-white p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              title="Refresh tickets"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
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
                >
                  Ticket ID
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  User
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Issue Summary
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Status
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Priority
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                >
                  Date Submitted
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
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
                      onClick={() => openTicketDetails(ticket)}
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
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={closeTicketDetails}
        onStatusChange={handleStatusChange}
      />
    </AdminLayout>
  );
};

export default SupportTickets; 