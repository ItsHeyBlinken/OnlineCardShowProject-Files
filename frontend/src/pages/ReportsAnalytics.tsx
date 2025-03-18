import React, { useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  UsersIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, icon }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-500 text-sm font-medium">{title}</div>
        <div className="bg-indigo-100 p-2 rounded-md text-indigo-600">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800 mb-1">{value}</div>
      <div className={`text-sm flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <span>{change}</span>
        <span className="ml-1">vs last month</span>
      </div>
    </div>
  );
};

interface TopSellerProps {
  rank: number;
  name: string;
  sales: string;
  growth: string;
  isPositive: boolean;
}

const TopSeller: React.FC<TopSellerProps> = ({ rank, name, sales, growth, isPositive }) => {
  return (
    <div className="py-3 px-2 flex items-center border-b last:border-b-0 border-gray-200">
      <div className="w-6 text-gray-500 text-sm font-medium">#{rank}</div>
      <div className="flex-grow ml-4">
        <div className="text-gray-800 font-medium">{name}</div>
        <div className="text-gray-500 text-sm">{sales}</div>
      </div>
      <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {growth}
      </div>
    </div>
  );
};

const ReportsAnalytics = () => {
  // Time period state
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  // Mock data for charts
  const userGrowthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Active Users',
        data: [1200, 1350, 1550, 1800, 2100, 2400, 2650, 2900, 3200, 3500, 3800, 4100],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };
  
  const salesTrendsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [8500, 9200, 11000, 10300, 12500, 13800, 15200, 16800, 18500, 20000, 22800, 25500],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 4,
      },
    ],
  };
  
  const subscriptionData = {
    labels: ['Free', 'Starter', 'Pro', 'Premium'],
    datasets: [
      {
        data: [35, 25, 30, 10],
        backgroundColor: [
          'rgba(209, 213, 219, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };
  
  const revenueCategoryData = {
    labels: ['Sports Cards', 'Collectibles', 'Memorabilia', 'Limited Editions', 'Accessories'],
    datasets: [
      {
        label: 'Revenue by Category',
        data: [38500, 25300, 18200, 15700, 12500],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(236, 72, 153, 0.7)',
        ],
        borderRadius: 4,
      },
    ],
  };
  
  const userGrowthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Growth',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
  };
  
  const salesTrendsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sales Trends',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };
  
  const subscriptionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Subscription Distribution',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
    },
    cutout: '60%',
  };
  
  const revenueCategoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Revenue by Category',
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          bottom: 20,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };
  
  // Handler for time period change
  const handleTimePeriodChange = (period: '7d' | '30d' | '90d' | '1y') => {
    setTimePeriod(period);
    // In a real app, this would trigger API calls to fetch data for the new time period
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Overview of your business performance and metrics</p>
      </div>
      
      {/* Time period selector */}
      <div className="mb-6 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => handleTimePeriodChange('7d')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              timePeriod === '7d'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => handleTimePeriodChange('30d')}
            className={`px-4 py-2 text-sm font-medium ${
              timePeriod === '30d'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-gray-300`}
          >
            30 Days
          </button>
          <button
            type="button"
            onClick={() => handleTimePeriodChange('90d')}
            className={`px-4 py-2 text-sm font-medium ${
              timePeriod === '90d'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-gray-300`}
          >
            90 Days
          </button>
          <button
            type="button"
            onClick={() => handleTimePeriodChange('1y')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              timePeriod === '1y'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-300`}
          >
            1 Year
          </button>
        </div>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Users"
          value="4,281"
          change="+8.1%"
          isPositive={true}
          icon={<UsersIcon className="h-6 w-6" />}
        />
        <MetricCard
          title="Monthly Active Users"
          value="3,127"
          change="+12.3%"
          isPositive={true}
          icon={<UserGroupIcon className="h-6 w-6" />}
        />
        <MetricCard
          title="Sales Volume"
          value="$125,430"
          change="+5.8%"
          isPositive={true}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
        />
        <MetricCard
          title="Avg. Order Value"
          value="$78.50"
          change="-2.3%"
          isPositive={false}
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
      </div>
      
      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-80">
            <Line options={userGrowthOptions} data={userGrowthData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-80">
            <Bar options={salesTrendsOptions} data={salesTrendsData} />
          </div>
        </div>
      </div>
      
      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-1">
          <div className="h-64">
            <Doughnut options={subscriptionOptions} data={subscriptionData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <div className="h-64">
            <Bar options={revenueCategoryOptions} data={revenueCategoryData} />
          </div>
        </div>
      </div>
      
      {/* Top sellers section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-1">
          <h2 className="font-bold text-lg text-gray-800 mb-4">Top Sellers</h2>
          <div>
            <TopSeller
              rank={1}
              name="Premium Cards Shop"
              sales="$12,450"
              growth="+18.3%"
              isPositive={true}
            />
            <TopSeller
              rank={2}
              name="Vintage Collections"
              sales="$8,720"
              growth="+12.5%"
              isPositive={true}
            />
            <TopSeller
              rank={3}
              name="Trading Card Masters"
              sales="$6,340"
              growth="-3.2%"
              isPositive={false}
            />
            <TopSeller
              rank={4}
              name="Rare Finds Store"
              sales="$5,120"
              growth="+9.7%"
              isPositive={true}
            />
            <TopSeller
              rank={5}
              name="Collector's Heaven"
              sales="$4,890"
              growth="+4.1%"
              isPositive={true}
            />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="font-bold text-lg text-gray-800 mb-4">Revenue Breakdown</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-600 mb-3">By Subscription Tier</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Premium</span>
                  </div>
                  <div className="text-sm font-medium">$48,250 (38.5%)</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Pro</span>
                  </div>
                  <div className="text-sm font-medium">$42,180 (33.6%)</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Starter</span>
                  </div>
                  <div className="text-sm font-medium">$35,000 (27.9%)</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-600 mb-3">By Payment Method</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Credit Card</span>
                  </div>
                  <div className="text-sm font-medium">$65,230 (52.0%)</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-sm text-gray-600">PayPal</span>
                  </div>
                  <div className="text-sm font-medium">$43,890 (35.0%)</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-pink-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Apple/Google Pay</span>
                  </div>
                  <div className="text-sm font-medium">$16,310 (13.0%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportsAnalytics; 