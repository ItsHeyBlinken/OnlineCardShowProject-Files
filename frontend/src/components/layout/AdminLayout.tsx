import React, { useState, useEffect } from 'react';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { 
  HomeIcon, UsersIcon, ShoppingCartIcon, ClipboardDocumentCheckIcon, 
  CreditCardIcon, TicketIcon, ChartBarIcon, DocumentTextIcon,
  Bars3Icon, XMarkIcon, ArrowLeftOnRectangleIcon, UserCircleIcon 
} from '@heroicons/react/24/outline';
import { isAdmin } from '../../utils/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const history = useHistory();
  
  // Check if the user is an admin on mount
  useEffect(() => {
    if (!isAdmin()) {
      // Redirect to login if not admin
      history.push('/login');
    }
  }, [history]);
  
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'User Management', href: '/admin/users', icon: UsersIcon },
    { name: 'Order Management', href: '/admin/orders', icon: ShoppingCartIcon },
    { name: 'Listing Moderation', href: '/admin/listings', icon: ClipboardDocumentCheckIcon },
    { name: 'Subscriptions & Payments', href: '/admin/subscriptions', icon: CreditCardIcon },
    { name: 'Support Tickets', href: '/admin/tickets', icon: TicketIcon },
    { name: 'Reports & Analytics', href: '/admin/reports', icon: ChartBarIcon },
    { name: 'System Logs', href: '/admin/logs', icon: DocumentTextIcon },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleLogout = () => {
    // Clear admin user from localStorage
    localStorage.removeItem('currentUser');
    
    // Redirect to login page
    history.push('/login');
  };

  // If user is not admin and we're still in the process of redirecting
  // Don't render the actual layout to prevent flashing of admin content
  const adminUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!adminUser.role || adminUser.role !== 'Admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 text-white transition-all duration-300 ease-in-out flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Admin Panel</h1>}
          <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-gray-700">
            {sidebarOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
        <nav className="flex-1 mt-5 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } group flex items-center px-2 py-3 text-sm font-medium rounded-md mb-1 transition-all`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                  aria-hidden="true"
                />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-gray-700">{adminUser.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center text-gray-700 hover:text-gray-900"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-1" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 