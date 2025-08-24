import { MagnifyingGlassIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  episodeCount: number;
  availableSlots: number;
  cpmRange: { min: number; max: number } | null;
  latestEpisode?: string;
}

const Inventory: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Loading available inventory...');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search-based inventory discovery (Demand Side)
  const [searchFilters, setSearchFilters] = useState({
    categories: [] as string[],
    minCpm: '',
    maxCpm: '',
    positions: [] as string[],
    query: ''
  });

  const searchInventory = async (filters = searchFilters, page = 1) => {
    try {
      setLoading(true);
      
      // Use search endpoint with filters for efficient discovery
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (filters.query) searchParams.append('q', filters.query);
      if (filters.categories.length > 0) searchParams.append('categories', filters.categories.join(','));
      if (filters.positions.length > 0) searchParams.append('positions', filters.positions.join(','));
      if (filters.minCpm) searchParams.append('min_cpm', filters.minCpm);
      if (filters.maxCpm) searchParams.append('max_cpm', filters.maxCpm);

      const response = await apiService.searchInventory(searchParams.toString());
      
      if (response.data?.data?.inventory) {
        // Convert search results to inventory items format
        const inventoryItems = response.data.data.inventory.map((slot: any) => ({
          id: slot.podcast_id || slot.id,
          name: slot.podcast_name || slot.name || 'Unknown Podcast',
          category: slot.category || 'General',
          description: slot.description || slot.episode_title,
          availableSlots: 1, // Each result is an available slot
          cpmRange: slot.cpm_floor ? { 
            min: parseFloat(slot.cpm_floor), 
            max: parseFloat(slot.cpm_floor) 
          } : null,
          position: slot.position,
          duration: slot.duration
        }));
        
        // Group by podcast for better UX
        const grouped = inventoryItems.reduce((acc: any, item: any) => {
          const existing = acc.find((p: any) => p.id === item.id);
          if (existing) {
            existing.availableSlots += 1;
            if (item.cpmRange && existing.cpmRange) {
              existing.cpmRange.min = Math.min(existing.cpmRange.min, item.cpmRange.min);
              existing.cpmRange.max = Math.max(existing.cpmRange.max, item.cpmRange.max);
            }
          } else {
            acc.push(item);
          }
          return acc;
        }, []);
        
        setInventory(grouped);
        setApiStatus(`✅ Found ${response.data.data.inventory.length} available slots!`);
      } else {
        setInventory([]);
        setApiStatus('No inventory matches your search criteria');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setApiStatus('❌ Authentication required - please login');
      } else {
        setApiStatus(`⚠️ Search error: ${error.response?.data?.error || error.message}`);
      }
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // Don't auto-search on page load - wait for user action
  useEffect(() => {
    // Set initial loading to false - no auto-search
    setLoading(false);
    setApiStatus('Ready to search. Please use filters and click Search to discover inventory.');
  }, []);

  const formatCPMRange = (cpmRange: { min: number; max: number } | null) => {
    if (!cpmRange) return '-';
    return `$${cpmRange.min.toFixed(2)}-$${cpmRange.max.toFixed(2)}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'technology':
        return 'bg-blue-100 text-blue-800';
      case 'lifestyle':
        return 'bg-purple-100 text-purple-800';
      case 'business':
        return 'bg-green-100 text-green-800';
      case 'education':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
              placeholder="Search podcasts, episodes..."
              value={searchFilters.query}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && searchInventory()}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => searchInventory()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Search Filters Panel */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <select
              multiple
              value={searchFilters.categories}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSearchFilters(prev => ({ ...prev, categories: values }));
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Technology">Technology</option>
              <option value="Business">Business</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="Education">Education</option>
              <option value="Health">Health</option>
              <option value="Entertainment">Entertainment</option>
            </select>
          </div>

          {/* Positions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ad Positions</label>
            <select
              multiple
              value={searchFilters.positions}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSearchFilters(prev => ({ ...prev, positions: values }));
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="pre_roll">Pre-roll</option>
              <option value="mid_roll">Mid-roll</option>
              <option value="post_roll">Post-roll</option>
            </select>
          </div>

          {/* CPM Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min CPM ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={searchFilters.minCpm}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, minCpm: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max CPM ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={searchFilters.maxCpm}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, maxCpm: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="100.00"
            />
          </div>
        </div>
        
        <div className="mt-4 flex space-x-3">
          <button
            onClick={() => searchInventory()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setSearchFilters({ categories: [], minCpm: '', maxCpm: '', positions: [], query: '' });
              searchInventory({ categories: [], minCpm: '', maxCpm: '', positions: [], query: '' });
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Search Results</h3>
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
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.latestEpisode || `${item.episodeCount} episodes`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.availableSlots > 0 ? `${item.availableSlots} slots` : 'No slots available'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCPMRange(item.cpmRange)}
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
                {inventory.reduce((total, item) => total + item.availableSlots, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg CPM</span>
              <span className="text-sm font-medium text-gray-900">
                {(() => {
                  const validRanges = inventory.filter(item => item.cpmRange);
                  if (validRanges.length === 0) return '-';
                  const avgCPM = validRanges.reduce((sum, item) => 
                    sum + ((item.cpmRange!.min + item.cpmRange!.max) / 2), 0) / validRanges.length;
                  return `$${avgCPM.toFixed(2)}`;
                })()}
              </span>
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