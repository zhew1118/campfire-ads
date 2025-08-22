import { PlusIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

const Campaigns: React.FC = () => {
  const campaigns = [
    {
      id: '1',
      name: 'Tech Podcast Summer Campaign',
      budget: '$5,000',
      spent: '$2,340',
      impressions: '145K',
      ctr: '2.4%',
      status: 'active'
    },
    {
      id: '2',
      name: 'Morning Show Ads',
      budget: '$3,000',
      spent: '$1,890',
      impressions: '89K',
      ctr: '3.1%',
      status: 'paused'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Campaigns</h1>
          <p className="text-gray-600">Create and manage your advertising campaigns</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Budget</h3>
          <p className="text-3xl font-bold text-gray-900">$8,000</p>
          <p className="text-sm text-gray-600">Across all campaigns</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
          <p className="text-3xl font-bold text-gray-900">$4,230</p>
          <p className="text-sm text-green-600">52.9% of budget</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Impressions</h3>
          <p className="text-3xl font-bold text-gray-900">234K</p>
          <p className="text-sm text-blue-600">+8.3% this week</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg CTR</h3>
          <p className="text-3xl font-bold text-gray-900">2.7%</p>
          <p className="text-sm text-gray-600">Industry avg: 2.1%</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Campaign List</h3>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget / Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR
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
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Created 2 weeks ago
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{campaign.budget}</div>
                    <div className="text-sm text-gray-500">{campaign.spent} spent</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.impressions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.ctr}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      campaign.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900 mr-3">
                      Edit
                    </button>
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      {campaign.status === 'active' ? 'Pause' : 'Resume'}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance</h3>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border-l-4 border-primary-500 pl-4">
                <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                  <span>{campaign.impressions} impressions</span>
                  <span>{campaign.ctr} CTR</span>
                  <span className={`font-medium ${
                    campaign.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Targeting Options</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Technology Podcasts</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Business & Finance</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">News & Politics</span>
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Paused</span>
            </div>
            <div className="mt-4">
              <button className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Modify Targeting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;