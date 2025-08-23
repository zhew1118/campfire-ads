import { MagnifyingGlassIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const Inventory: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Loading available inventory...');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load available inventory (Demand Side - Advertisers browse all available slots)
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        // TODO: Create /api/inventory/available endpoint
        // For now, we'll get all podcasts to show available inventory
        const response = await apiService.getPodcasts();
        if (response.data?.data?.podcasts) {
          setInventory(response.data.data.podcasts);
          setApiStatus('✅ Successfully loaded available inventory!');
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          setApiStatus('❌ Authentication required - please login');
        } else {
          setApiStatus(`⚠️ Error loading inventory: ${error.response?.data?.error || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadInventory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Inventory</h1>
          <p className="text-gray-600">Discover available ad slots across podcasts (Demand Side)</p>
          <p className="text-sm mt-2">{apiStatus}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search podcasts, categories..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available Inventory</h3>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Podcast
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available Slots
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPM Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading available inventory...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No inventory available at the moment.
                  </td>
                </tr>
              ) : (
                inventory.map((podcast: any) => (
                  <tr key={podcast.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {podcast.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {podcast.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {podcast.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      0 slots {/* TODO: Get available slot count */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      $15-45 {/* TODO: Get CPM range from slots */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        View Slots
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-3">
                        Create Campaign
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Available Podcasts</span>
              <span className="text-sm font-medium text-gray-900">{inventory.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Ad Slots</span>
              <span className="text-sm font-medium text-gray-900">
                0 {/* TODO: Sum all available slots */}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg CPM</span>
              <span className="text-sm font-medium text-gray-900">$25</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Categories</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-900">Technology</span>
              <span className="text-xs text-gray-500">45% of inventory</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-900">Business</span>
              <span className="text-xs text-gray-500">25% of inventory</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-900">Lifestyle</span>
              <span className="text-xs text-gray-500">20% of inventory</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md">
              Create New Campaign
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md">
              Browse by Category
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;