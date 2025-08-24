import { PlusIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface AdSlot {
  id: string;
  episode_id: string;
  position: 'pre_roll' | 'mid_roll' | 'post_roll';
  duration: number; // seconds
  cpm_floor: string; // CPM as decimal string from database
  available: boolean;
  start_time?: number; // seconds from episode start (for mid-roll)
  created_at: string;
  updated_at: string;
  // Additional fields from joins
  episode_title?: string;
  podcast_name?: string;
}

const Slots: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Loading your ad slots...');
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [filterAvailable, setFilterAvailable] = useState<string>('all');

  // Load podcaster's ad slots across all episodes
  useEffect(() => {
    const loadAdSlots = async () => {
      try {
        setLoading(true);
        const allSlots: AdSlot[] = [];
        
        // Get podcasts first, then episodes, then slots
        const podcastResponse = await apiService.getPodcasts();
        if (podcastResponse.data?.data?.podcasts) {
          
          for (const podcast of podcastResponse.data.data.podcasts) {
            try {
              const episodeResponse = await apiService.getEpisodes(podcast.id);
              if (episodeResponse.data?.data?.episodes) {
                
                for (const episode of episodeResponse.data.data.episodes) {
                  try {
                    const slotsResponse = await apiService.getAdSlots(episode.id);
                    if (slotsResponse.data?.data?.slots) {
                      const slotsWithDetails = slotsResponse.data.data.slots.map((slot: AdSlot) => ({
                        ...slot,
                        episode_title: episode.title,
                        podcast_name: podcast.name
                      }));
                      allSlots.push(...slotsWithDetails);
                    }
                  } catch (error) {
                    console.log(`No slots found for episode ${episode.title}`);
                  }
                }
              }
            } catch (error) {
              console.log(`No episodes found for podcast ${podcast.name}`);
            }
          }
        }
        
        setAdSlots(allSlots);
        setApiStatus(`✅ Successfully loaded ${allSlots.length} ad slots across your content!`);
      } catch (error: any) {
        if (error.response?.status === 401) {
          setApiStatus('❌ Authentication required - please login');
        } else {
          setApiStatus(`⚠️ Error loading ad slots: ${error.response?.data?.error || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadAdSlots();
  }, []);

  const formatCPM = (cpmCents: string | number) => {
    const cents = typeof cpmCents === 'string' ? parseFloat(cpmCents) * 100 : cpmCents;
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'pre_roll':
        return 'Pre-roll';
      case 'mid_roll':
        return 'Mid-roll';
      case 'post_roll':
        return 'Post-roll';
      default:
        return position;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'pre_roll':
        return 'bg-green-100 text-green-800';
      case 'mid_roll':
        return 'bg-blue-100 text-blue-800';
      case 'post_roll':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateSlot = () => {
    setEditingSlot(null);
    setShowCreateModal(true);
  };

  const handleEditSlot = (slot: AdSlot) => {
    setEditingSlot(slot);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingSlot(null);
  };

  const toggleSlotAvailability = async (slot: AdSlot) => {
    try {
      // TODO: Implement API call to update slot availability
      const updatedSlots = adSlots.map(s => 
        s.id === slot.id ? { ...s, available: !s.available } : s
      );
      setAdSlots(updatedSlots);
    } catch (error) {
      console.error('Error updating slot availability:', error);
    }
  };

  // Filter slots based on selected filters
  const filteredSlots = adSlots.filter(slot => {
    const positionMatch = filterPosition === 'all' || slot.position === filterPosition;
    const availableMatch = filterAvailable === 'all' || 
      (filterAvailable === 'available' && slot.available) ||
      (filterAvailable === 'unavailable' && !slot.available);
    return positionMatch && availableMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Slot Management</h1>
          <p className="text-gray-600">Manage ad slots and set CPM pricing across your episodes</p>
          <p className="text-sm mt-2">{apiStatus}</p>
        </div>
        <button 
          onClick={handleCreateSlot}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Ad Slot
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Positions</option>
              <option value="pre_roll">Pre-roll</option>
              <option value="mid_roll">Mid-roll</option>
              <option value="post_roll">Post-roll</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              value={filterAvailable}
              onChange={(e) => setFilterAvailable(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Slots</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Ad Slots ({filteredSlots.length} of {adSlots.length})
          </h3>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Episode & Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPM Floor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading your ad slots...
                  </td>
                </tr>
              ) : filteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    {adSlots.length === 0 
                      ? 'No ad slots yet. Create your first ad slot to start monetizing!'
                      : 'No slots match the current filters.'}
                  </td>
                </tr>
              ) : (
                filteredSlots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <CurrencyDollarIcon className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {slot.episode_title || 'Unknown Episode'}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(slot.position)}`}>
                              {getPositionLabel(slot.position)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {slot.podcast_name || 'Unknown Podcast'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {formatDuration(slot.duration)}
                      </div>
                      {slot.start_time && (
                        <div className="text-xs text-gray-500">
                          Starts at {formatDuration(slot.start_time)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCPM(slot.cpm_floor)} CPM
                      </div>
                      <div className="text-xs text-gray-500">
                        ${(parseFloat(slot.cpm_floor) * slot.duration / 30).toFixed(2)} per 30s
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleSlotAvailability(slot)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                          slot.available
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {slot.available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      $0 {/* TODO: Calculate actual revenue */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEditSlot(slot)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        Edit
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Pricing
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        Analytics
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Slot Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Slots</span>
              <span className="text-sm font-medium text-gray-900">{adSlots.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Available</span>
              <span className="text-sm font-medium text-green-600">
                {adSlots.filter(slot => slot.available).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Sold</span>
              <span className="text-sm font-medium text-red-600">
                {adSlots.filter(slot => !slot.available).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Position Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pre-roll</span>
              <span className="text-sm font-medium text-gray-900">
                {adSlots.filter(slot => slot.position === 'pre_roll').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Mid-roll</span>
              <span className="text-sm font-medium text-gray-900">
                {adSlots.filter(slot => slot.position === 'mid_roll').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Post-roll</span>
              <span className="text-sm font-medium text-gray-900">
                {adSlots.filter(slot => slot.position === 'post_roll').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">CPM Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average CPM</span>
              <span className="text-sm font-medium text-gray-900">
                {adSlots.length > 0 
                  ? formatCPM(adSlots.reduce((sum, slot) => sum + parseFloat(slot.cpm_floor), 0) / adSlots.length)
                  : '$0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Highest CPM</span>
              <span className="text-sm font-medium text-green-600">
                {adSlots.length > 0 
                  ? formatCPM(Math.max(...adSlots.map(slot => parseFloat(slot.cpm_floor))))
                  : '$0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Lowest CPM</span>
              <span className="text-sm font-medium text-red-600">
                {adSlots.length > 0 
                  ? formatCPM(Math.min(...adSlots.map(slot => parseFloat(slot.cpm_floor))))
                  : '$0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleCreateSlot}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Create Ad Slot
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md">
              Bulk Price Update
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
              Revenue Report
            </button>
          </div>
        </div>
      </div>

      {/* TODO: Add Create/Edit Ad Slot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingSlot ? 'Edit Ad Slot' : 'Create New Ad Slot'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Ad slot creation form will be implemented here.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  {editingSlot ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Slots;