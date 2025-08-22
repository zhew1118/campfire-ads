import { PlusIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

const Podcasts: React.FC = () => {
  const podcasts = [
    {
      id: '1',
      title: 'The Daily Tech Show',
      rss_url: 'https://example.com/rss',
      episodes: 145,
      revenue: '$1,234',
      status: 'active'
    },
    {
      id: '2',
      title: 'Morning Coffee Chat',
      rss_url: 'https://example.com/rss2',
      episodes: 89,
      revenue: '$987',
      status: 'active'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Podcasts</h1>
          <p className="text-gray-600">Manage your podcast inventory and ad slots</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
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
              {podcasts.map((podcast) => (
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
                          {podcast.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {podcast.rss_url}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {podcast.episodes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {podcast.revenue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {podcast.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                      Edit
                    </button>
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      Sync
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      Analytics
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Podcasts</span>
              <span className="text-sm font-medium text-gray-900">{podcasts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Episodes</span>
              <span className="text-sm font-medium text-gray-900">
                {podcasts.reduce((sum, p) => sum + p.episodes, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Available Ad Slots</span>
              <span className="text-sm font-medium text-gray-900">342</span>
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
    </div>
  );
};

export default Podcasts;