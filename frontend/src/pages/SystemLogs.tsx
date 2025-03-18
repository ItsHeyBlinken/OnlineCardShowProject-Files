import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface LogEntry {
  id: string;
  type: 'Error' | 'Warning' | 'Info';
  description: string;
  userAffected: string | null;
  timestamp: string;
  details?: string;
}

type SortField = 'id' | 'type' | 'description' | 'userAffected' | 'timestamp';
type SortDirection = 'asc' | 'desc';

const SystemLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Mock logs data
  const [logs] = useState<LogEntry[]>([
    {
      id: "LOG-1001",
      type: "Error",
      description: "Payment processing failed",
      userAffected: "John Smith",
      timestamp: "2023-07-15 14:32:45",
      details: "Stripe payment intent creation failed with error code: card_declined"
    },
    {
      id: "LOG-1002",
      type: "Warning",
      description: "High CPU usage detected",
      userAffected: null,
      timestamp: "2023-07-15 10:18:22",
      details: "Server CPU usage reached 85% for more than 5 minutes"
    },
    {
      id: "LOG-1003",
      type: "Info",
      description: "New user registered",
      userAffected: "Emily Wilson",
      timestamp: "2023-07-14 16:22:10",
      details: "User completed registration process successfully"
    },
    {
      id: "LOG-1004",
      type: "Error",
      description: "Database connection timeout",
      userAffected: null,
      timestamp: "2023-07-14 08:45:33",
      details: "Connection to primary database server timed out after 30 seconds"
    },
    {
      id: "LOG-1005",
      type: "Info",
      description: "System backup completed",
      userAffected: null,
      timestamp: "2023-07-14 04:00:12",
      details: "Daily backup routine completed successfully, size: 2.3GB"
    },
    {
      id: "LOG-1006",
      type: "Warning",
      description: "Failed login attempts",
      userAffected: "Sarah Jones",
      timestamp: "2023-07-13 22:17:08",
      details: "Multiple failed login attempts (5) detected from IP 192.168.1.105"
    },
    {
      id: "LOG-1007",
      type: "Error",
      description: "API rate limit exceeded",
      userAffected: "Robert Chen",
      timestamp: "2023-07-13 15:41:56",
      details: "User exceeded API rate limit of 100 requests per minute"
    },
    {
      id: "LOG-1008",
      type: "Info",
      description: "Scheduled maintenance started",
      userAffected: null,
      timestamp: "2023-07-13 01:00:00",
      details: "Scheduled database index optimization process started"
    },
    {
      id: "LOG-1009",
      type: "Warning",
      description: "Low disk space",
      userAffected: null,
      timestamp: "2023-07-12 19:28:33",
      details: "Server storage space below 15% threshold (12.8% remaining)"
    },
    {
      id: "LOG-1010",
      type: "Info",
      description: "Configuration updated",
      userAffected: "Admin User",
      timestamp: "2023-07-12 11:05:19",
      details: "System configuration parameters updated via admin panel"
    }
  ]);
  
  // Filter and sort logs
  const filteredAndSortedLogs = [...logs]
    .filter(log => 
      // Type filter
      (selectedType === 'All' || log.type === selectedType) &&
      
      // Date range filter
      (!startDate || new Date(log.timestamp) >= new Date(startDate)) &&
      (!endDate || new Date(log.timestamp) <= new Date(endDate + 'T23:59:59')) &&
      
      // Search term
      (log.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
       log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (log.userAffected && log.userAffected.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Handle null values in sorting
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null) return sortDirection === 'asc' ? 1 : -1;
      
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
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 inline ml-1" />
      : <ArrowDownIcon className="h-4 w-4 inline ml-1" />;
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-1" />;
      case 'Warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-1" />;
      case 'Info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-1" />;
      default:
        return null;
    }
  };
  
  const getTypeClass = (type: string) => {
    switch (type) {
      case 'Error':
        return 'bg-red-100 text-red-800';
      case 'Warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'Info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSelectedType('All');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">System Logs</h1>
        <p className="text-gray-600 mt-1">View and analyze system events and errors</p>
      </div>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div>
              <span className="text-sm font-medium text-gray-700 mr-2">Type:</span>
              <select 
                className="border border-gray-300 rounded-md text-sm p-2"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Error">Error</option>
                <option value="Warning">Warning</option>
                <option value="Info">Info</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-1" />
                <span className="text-sm font-medium text-gray-700 mr-2">From:</span>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md text-sm p-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">To:</span>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md text-sm p-2"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter indicators and clear button */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(selectedType !== 'All' || startDate || endDate || searchTerm) && (
            <>
              <div className="text-sm text-gray-600">
                Active filters:
              </div>
              
              {selectedType !== 'All' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Type: {selectedType}
                </span>
              )}
              
              {startDate && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  From: {startDate}
                </span>
              )}
              
              {endDate && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  To: {endDate}
                </span>
              )}
              
              {searchTerm && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Search: "{searchTerm}"
                </span>
              )}
              
              <button
                onClick={clearFilters}
                className="ml-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear all
              </button>
            </>
          )}
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
                  Log ID {renderSortIcon('id')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  Type {renderSortIcon('type')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('description')}
                >
                  Description {renderSortIcon('description')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('userAffected')}
                >
                  User Affected {renderSortIcon('userAffected')}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('timestamp')}
                >
                  Timestamp {renderSortIcon('timestamp')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getTypeClass(log.type)}`}>
                      {getTypeIcon(log.type)}
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {log.description}
                      {log.details && (
                        <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {log.userAffected || <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
              
              {filteredAndSortedLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No logs found matching the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredAndSortedLogs.length} of {logs.length} logs
      </div>
    </AdminLayout>
  );
};

export default SystemLogs; 