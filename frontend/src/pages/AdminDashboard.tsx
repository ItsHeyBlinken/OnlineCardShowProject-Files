import React from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  UserGroupIcon, 
  ShoppingCartIcon, 
  CurrencyDollarIcon, 
  TicketIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, change, changeType }) => (
  <div className="bg-white rounded-lg shadow p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} text-white mr-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      {change && (
        <div className={`text-sm font-medium ${
          changeType === 'increase' ? 'text-green-600' : 'text-red-600'
        }`}>
          {changeType === 'increase' ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  </div>
);

const BarChart = () => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-lg font-medium text-gray-700 mb-4">User Growth</h3>
    <div className="h-64 flex items-end space-x-2">
      {[40, 55, 65, 50, 80, 90, 75].map((height, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div 
            className="bg-indigo-500 w-full rounded-t" 
            style={{ height: `${height}%` }}
          ></div>
          <div className="text-xs text-gray-500 mt-2">Week {i+1}</div>
        </div>
      ))}
    </div>
  </div>
);

const LineChart = () => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-lg font-medium text-gray-700 mb-4">Sales Trend</h3>
    <div className="h-64 relative">
      <svg viewBox="0 0 600 200" className="w-full h-full">
        <path 
          d="M0,150 C100,100 200,180 300,100 C400,20 500,120 600,100" 
          fill="none" 
          stroke="#4f46e5" 
          strokeWidth="3"
        />
        <path 
          d="M0,150 C100,100 200,180 300,100 C400,20 500,120 600,100 L600,200 L0,200 Z" 
          fill="rgba(79, 70, 229, 0.1)" 
          stroke="none"
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
        <div>Jan</div>
        <div>Feb</div>
        <div>Mar</div>
        <div>Apr</div>
        <div>May</div>
        <div>Jun</div>
      </div>
    </div>
  </div>
);

const RecentActivityCard = () => (
  <div className="bg-white rounded-lg shadow p-6 h-full">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Recent Activity</h2>
      <button className="text-indigo-600 hover:text-indigo-800 text-sm">View All</button>
    </div>
    <div className="space-y-4">
      {[
        { action: 'New user registered', time: '2 hours ago', user: 'John Smith' },
        { action: 'New order placed', time: '4 hours ago', user: 'Alice Brown' },
        { action: 'Support ticket created', time: '5 hours ago', user: 'Robert Johnson' },
        { action: 'Subscription upgraded', time: '8 hours ago', user: 'Emily White' },
        { action: 'New listing added', time: '10 hours ago', user: 'Michael Davis' }
      ].map((activity, i) => (
        <div key={i} className="border-b pb-2 last:border-0">
          <p className="text-sm font-medium text-gray-800">{activity.action}</p>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-500">{activity.user}</p>
            <p className="text-xs text-gray-400">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TopSellersCard = () => (
  <div className="bg-white rounded-lg shadow p-6 h-full">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Top Sellers</h2>
      <button className="text-indigo-600 hover:text-indigo-800 text-sm">View All</button>
    </div>
    <div className="space-y-4">
      {[
        { name: 'Premium Cards Shop', revenue: '$12,450', growth: '+12%' },
        { name: 'Vintage Collections', revenue: '$8,320', growth: '+8%' },
        { name: 'Rare Finds Store', revenue: '$6,450', growth: '+5%' },
        { name: 'Collector\'s Heaven', revenue: '$5,200', growth: '+3%' },
        { name: 'Trading Card Masters', revenue: '$4,850', growth: '+2%' }
      ].map((seller, i) => (
        <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
          <div>
            <p className="text-sm font-medium text-gray-800">{seller.name}</p>
            <p className="text-xs text-gray-500">{seller.revenue}</p>
          </div>
          <span className="text-xs text-green-600 font-medium">{seller.growth}</span>
        </div>
      ))}
    </div>
  </div>
);

const AdminDashboard = () => {
  // Mock stats data
  const stats: StatCardProps[] = [
    { 
      title: 'Total Users', 
      value: '8,249', 
      icon: UserGroupIcon, 
      color: 'bg-blue-500',
      change: '12%',
      changeType: 'increase'
    },
    { 
      title: 'Active Sellers', 
      value: '1,520', 
      icon: UserIcon, 
      color: 'bg-purple-500',
      change: '8%',
      changeType: 'increase'
    },
    { 
      title: 'Total Orders', 
      value: '24,356', 
      icon: ShoppingCartIcon, 
      color: 'bg-green-500',
      change: '5%',
      changeType: 'increase'
    },
    { 
      title: 'Support Tickets', 
      value: '42', 
      icon: TicketIcon, 
      color: 'bg-red-500',
      change: '3%',
      changeType: 'decrease'
    },
    { 
      title: 'Platform Revenue', 
      value: '$156,289', 
      icon: CurrencyDollarIcon, 
      color: 'bg-indigo-500',
      change: '15%',
      changeType: 'increase'
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and statistics</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BarChart />
        <LineChart />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard />
        <TopSellersCard />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard; 