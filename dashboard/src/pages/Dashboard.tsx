import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MicrophoneIcon, 
  SpeakerWaveIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AvailableInventoryPreview from '../components/AvailableInventoryPreview';

// Sample data for charts
const revenueData = [
  { name: 'Jan', revenue: 4000, impressions: 2400 },
  { name: 'Feb', revenue: 3000, impressions: 1398 },
  { name: 'Mar', revenue: 2000, impressions: 9800 },
  { name: 'Apr', revenue: 2780, impressions: 3908 },
  { name: 'May', revenue: 1890, impressions: 4800 },
  { name: 'Jun', revenue: 2390, impressions: 3800 },
];

const campaignData = [
  { name: 'Jan', spend: 2000, clicks: 1200 },
  { name: 'Feb', spend: 2500, clicks: 1800 },
  { name: 'Mar', spend: 3000, clicks: 2200 },
  { name: 'Apr', spend: 2800, clicks: 2100 },
  { name: 'May', spend: 3200, clicks: 2400 },
  { name: 'Jun', spend: 2900, clicks: 2300 },
];

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Podcaster Dashboard (Supply Side)
  if (user.role === 'podcaster') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Podcaster Dashboard</h1>
            <p className="text-gray-600">Manage your podcast inventory and track revenue</p>
          </div>
          <Link
            to="/podcasts"
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Podcast
          </Link>
        </div>

        {/* Key Metrics for Podcasters */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MicrophoneIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">My Podcasts</h3>
                <p className="text-3xl font-bold text-gray-900">2</p>
                <p className="text-sm text-green-600">All active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SpeakerWaveIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Episodes</h3>
                <p className="text-3xl font-bold text-gray-900">1</p>
                <p className="text-sm text-blue-600">Ready for ads</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Available Ad Slots</h3>
                <p className="text-3xl font-bold text-gray-900">2</p>
                <p className="text-sm text-green-600">$2.50-$3.00 CPM</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
                <p className="text-3xl font-bold text-gray-900">$2,390</p>
                <p className="text-sm text-green-600">+12% from last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue & Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
              <Bar dataKey="impressions" fill="#6366f1" name="Impressions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/podcasts"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <MicrophoneIcon className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Manage My Podcasts</span>
                </div>
                <span className="text-xs text-gray-500">2 active</span>
              </Link>
              
              <Link
                to="/episodes"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <SpeakerWaveIcon className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Add New Episodes</span>
                </div>
                <span className="text-xs text-gray-500">1 episode</span>
              </Link>
              
              <Link
                to="/slots"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Manage Ad Slots & Pricing</span>
                </div>
                <span className="text-xs text-gray-500">2 slots</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Ad slot booked on "The Future of AI"</span>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">CPM updated for pre-roll slots</span>
                </div>
                <span className="text-xs text-gray-500">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">New episode published</span>
                </div>
                <span className="text-xs text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Top Performing Content</h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Episode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad Slots
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">The Future of AI</div>
                    <div className="text-sm text-gray-500">Tech Talk Daily</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">2 slots</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">$125</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      100% booked
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Advertiser Dashboard (Demand Side)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertiser Dashboard</h1>
          <p className="text-gray-600">Monitor your campaigns and discover new inventory</p>
        </div>
        <Link
          to="/campaigns"
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Campaign
        </Link>
      </div>

      {/* Key Metrics for Advertisers */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Spend</h3>
              <p className="text-3xl font-bold text-gray-900">$4,230</p>
              <p className="text-sm text-green-600">68% of budget</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Campaigns</h3>
              <p className="text-3xl font-bold text-gray-900">3</p>
              <p className="text-sm text-blue-600">2 performing above target</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Impressions</h3>
              <p className="text-3xl font-bold text-gray-900">234K</p>
              <p className="text-sm text-green-600">+8.3% this week</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold text-sm">CTR</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Click-Through Rate</h3>
              <p className="text-3xl font-bold text-gray-900">2.7%</p>
              <p className="text-sm text-green-600">Above industry avg (2.1%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={campaignData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="spend" fill="#f59e0b" name="Spend ($)" />
            <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions & Campaign Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/inventory"
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <MicrophoneIcon className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Browse Available Inventory</span>
              </div>
              <span className="text-xs text-gray-500">2 podcasts</span>
            </Link>
            
            <Link
              to="/campaigns"
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">Manage My Campaigns</span>
              </div>
              <span className="text-xs text-gray-500">3 active</span>
            </Link>
            
            <Link
              to="/analytics"
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center">
                <EyeIcon className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900">View Analytics & Reports</span>
              </div>
              <span className="text-xs text-gray-500">Live data</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Tech Podcast Summer Campaign</span>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Morning Show Ads</span>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-yellow-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600">Holiday Special</span>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Paused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Inventory Preview */}
      <AvailableInventoryPreview />
    </div>
  );
};

export default Dashboard;