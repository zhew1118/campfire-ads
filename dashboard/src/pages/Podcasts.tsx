import { PlusIcon, MicrophoneIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import PodcastModal from '../components/PodcastModal';

const Podcasts: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Testing API connection...');
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<any>(null);
  const [deletingPodcast, setDeletingPodcast] = useState<any>(null);

  // Load podcaster's podcasts (Supply Side Management)
  useEffect(() => {
    const loadPodcasts = async () => {
      try {
        setLoading(true);
        const response = await apiService.getPodcasts();
        if (response.data?.data?.podcasts) {
          setPodcasts(response.data.data.podcasts);
          setApiStatus('✅ Successfully loaded your podcasts!');
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          setApiStatus('❌ Authentication required - please login');
        } else {
          setApiStatus(`⚠️ Error loading podcasts: ${error.response?.data?.error || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadPodcasts();
  }, []);

  const handleSavePodcast = async (podcastData: any) => {
    try {
      if (podcastData.id) {
        // Update existing podcast
        await apiService.updatePodcast(podcastData.id, podcastData);
        setApiStatus(`✅ Successfully updated podcast "${podcastData.name}"!`);
      } else {
        // Create new podcast
        await apiService.createPodcast(podcastData);
        setApiStatus(`✅ Successfully created podcast "${podcastData.name}"!`);
      }
      
      // Reload podcasts to reflect changes
      const updatedResponse = await apiService.getPodcasts();
      if (updatedResponse.data?.data?.podcasts) {
        setPodcasts(updatedResponse.data.data.podcasts);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to save podcast');
    }
  };

  const handleDeletePodcast = async (podcast: any) => {
    try {
      await apiService.deletePodcast(podcast.id);
      setApiStatus(`✅ Successfully deleted podcast "${podcast.name}"`);
      
      // Remove from local state
      setPodcasts(podcasts.filter((p: any) => p.id !== podcast.id));
      setDeletingPodcast(null);
    } catch (error: any) {
      setApiStatus(`❌ Error deleting podcast: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Podcasts</h1>
          <p className="text-gray-600">Manage your podcast inventory and ad slots (Supply Side)</p>
          <p className="text-sm mt-2">{apiStatus}</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Podcast
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Podcast List</h3>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Podcast
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Episodes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                    Loading your podcasts...
                  </td>
                </tr>
              ) : podcasts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No podcasts yet. Create your first podcast to start managing your inventory!
                  </td>
                </tr>
              ) : (
                podcasts.map((podcast: any) => (
                  <tr key={podcast.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <MicrophoneIcon className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {podcast.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {podcast.category} • {podcast.language}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      0 {/* TODO: Get episode count from episodes table */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      $0 {/* TODO: Calculate revenue from ad slots */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        podcast.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {podcast.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => setEditingPodcast(podcast)}
                        className="text-blue-600 hover:text-blue-900 mr-3 flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        Episodes
                      </button>
                      <button 
                        onClick={() => setDeletingPodcast(podcast)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Inventory Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Your Podcasts</span>
              <span className="text-sm font-medium text-gray-900">{podcasts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Episodes</span>
              <span className="text-sm font-medium text-gray-900">
                0 {/* TODO: Sum episodes across all podcasts */}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Available Ad Slots</span>
              <span className="text-sm font-medium text-gray-900">0 {/* TODO: Sum available slots */}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Episodes</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-900">Tech News Weekly #145</span>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-900">Morning Coffee #89</span>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-900">Tech Deep Dive #67</span>
              <span className="text-xs text-gray-500">2 days ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pre-roll Ads</span>
              <span className="text-sm font-medium text-gray-900">$1,456</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Mid-roll Ads</span>
              <span className="text-sm font-medium text-gray-900">$2,341</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Post-roll Ads</span>
              <span className="text-sm font-medium text-gray-900">$567</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Podcast Modal */}
      <PodcastModal
        isOpen={showCreateModal || editingPodcast !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingPodcast(null);
        }}
        podcast={editingPodcast}
        onSave={handleSavePodcast}
      />

      {/* Delete Confirmation Modal */}
      {deletingPodcast && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Podcast
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete "{deletingPodcast.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingPodcast(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeletePodcast(deletingPodcast)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Podcasts;