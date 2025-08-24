import { PlusIcon, PlayIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  description?: string;
  duration: number; // seconds
  audio_url: string;
  file_size?: number;
  episode_number?: number;
  season_number?: number;
  published_at?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  podcast_name?: string; // Added for display
}

const Episodes: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Loading your episodes...');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);

  // Load podcaster's episodes across all podcasts
  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        setLoading(true);
        // First get podcasts, then episodes for each
        const podcastResponse = await apiService.getPodcasts();
        if (podcastResponse.data?.data?.podcasts) {
          const allEpisodes: Episode[] = [];
          
          for (const podcast of podcastResponse.data.data.podcasts) {
            try {
              const episodeResponse = await apiService.getEpisodes(podcast.id);
              if (episodeResponse.data?.data?.episodes) {
                const episodesWithPodcast = episodeResponse.data.data.episodes.map((ep: Episode) => ({
                  ...ep,
                  podcast_name: podcast.name
                }));
                allEpisodes.push(...episodesWithPodcast);
              }
            } catch (error) {
              console.log(`No episodes found for podcast ${podcast.name}`);
            }
          }
          
          setEpisodes(allEpisodes);
          setApiStatus(`✅ Successfully loaded ${allEpisodes.length} episodes across your podcasts!`);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          setApiStatus('❌ Authentication required - please login');
        } else {
          setApiStatus(`⚠️ Error loading episodes: ${error.response?.data?.error || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadEpisodes();
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateEpisode = () => {
    setEditingEpisode(null);
    setShowCreateModal(true);
  };

  const handleEditEpisode = (episode: Episode) => {
    setEditingEpisode(episode);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingEpisode(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Episode Management</h1>
          <p className="text-gray-600">Manage episodes across all your podcasts (Supply Side)</p>
          <p className="text-sm mt-2">{apiStatus}</p>
        </div>
        <button 
          onClick={handleCreateEpisode}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Episode
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Episodes</h3>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Episode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Podcast
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Slots
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
                    Loading your episodes...
                  </td>
                </tr>
              ) : episodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No episodes yet. Create your first episode to start managing ad slots!
                  </td>
                </tr>
              ) : (
                episodes.map((episode) => (
                  <tr key={episode.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <PlayIcon className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {episode.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {episode.episode_number ? `Episode ${episode.episode_number}` : 'No episode number'} 
                            {episode.season_number ? ` • Season ${episode.season_number}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{episode.podcast_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{formatFileSize(episode.file_size)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {formatDuration(episode.duration)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(episode.status)}`}>
                        {episode.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      0 slots {/* TODO: Get actual slot count */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEditEpisode(episode)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        Edit
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Manage Ad Slots
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Episode Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Episodes</span>
              <span className="text-sm font-medium text-gray-900">{episodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Published</span>
              <span className="text-sm font-medium text-gray-900">
                {episodes.filter(ep => ep.status === 'published').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Draft</span>
              <span className="text-sm font-medium text-gray-900">
                {episodes.filter(ep => ep.status === 'draft').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {episodes.slice(0, 3).map((episode) => (
              <div key={episode.id} className="flex justify-between">
                <span className="text-sm text-gray-900 truncate">{episode.title}</span>
                <span className="text-xs text-gray-500">
                  {episode.status === 'published' ? 'Published' : 'Updated'}
                </span>
              </div>
            ))}
            {episodes.length === 0 && (
              <div className="text-sm text-gray-500">No recent activity</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleCreateEpisode}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Add New Episode
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md">
              Bulk Upload Episodes
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md">
              Episode Analytics
            </button>
          </div>
        </div>
      </div>

      {/* TODO: Add Create/Edit Episode Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEpisode ? 'Edit Episode' : 'Create New Episode'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Episode creation form will be implemented here.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  {editingEpisode ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Episodes;