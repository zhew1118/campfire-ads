import { PlusIcon, SpeakerWaveIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import CampaignModal from '../components/CampaignModal';

interface Campaign {
  id: string;
  name: string;
  advertiser_id: string;
  budget: number;
  target_demographic: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
  targeting_criteria: {
    categories: string[];
    min_cpm: number;
    max_cpm: number;
    geo_targeting?: string[];
  };
  created_at: string;
  updated_at: string;
}

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Load campaigns from API
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const response = await apiService.getCampaigns();
        if (response.data?.data?.campaigns) {
          setCampaigns(response.data.data.campaigns);
        }
      } catch (error) {
        console.error('Failed to load campaigns:', error);
        // For now, use mock data if API fails
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaigns();
  }, []);

  const handleCreateCampaign = async (campaignData: any) => {
    try {
      const response = await apiService.createCampaign(campaignData);
      if (response.data?.data) {
        setCampaigns(prev => [...prev, response.data.data]);
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  };

  const handleUpdateCampaign = async (campaignData: any) => {
    if (!selectedCampaign) return;
    
    try {
      const response = await apiService.updateCampaign(selectedCampaign.id, campaignData);
      if (response.data?.data) {
        setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? response.data.data : c));
      }
    } catch (error) {
      console.error('Failed to update campaign:', error);
      throw error;
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await apiService.deleteCampaign(campaignId);
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setSelectedCampaign(null);
  };

  const handleModalSave = async (campaignData: any) => {
    if (selectedCampaign) {
      await handleUpdateCampaign(campaignData);
    } else {
      await handleCreateCampaign(campaignData);
    }
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(budget);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ad Campaigns</h1>
          <p className="text-gray-600">Create and manage your advertising campaigns</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Budget</h3>
          <p className="text-3xl font-bold text-gray-900">{formatBudget(totalBudget)}</p>
          <p className="text-sm text-gray-600">Across {campaigns.length} campaigns</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Active Campaigns</h3>
          <p className="text-3xl font-bold text-gray-900">{activeCampaigns}</p>
          <p className="text-sm text-green-600">{campaigns.length - activeCampaigns} inactive</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Status Breakdown</h3>
          <p className="text-3xl font-bold text-gray-900">{campaigns.length}</p>
          <p className="text-sm text-blue-600">Total campaigns created</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg Budget</h3>
          <p className="text-3xl font-bold text-gray-900">
            {campaigns.length > 0 ? formatBudget(totalBudget / campaigns.length) : '$0'}
          </p>
          <p className="text-sm text-gray-600">Per campaign</p>
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
                  Budget / Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demographic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
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
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No campaigns created yet. Click "Create Campaign" to get started.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
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
                            Created {formatDate(campaign.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatBudget(campaign.budget)}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.target_demographic}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.targeting_criteria.categories.join(', ') || 'All'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEditCampaign(campaign)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <PencilIcon className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Campaigns</h3>
          <div className="space-y-4">
            {campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="border-l-4 border-primary-500 pl-4">
                <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                  <span>{formatBudget(campaign.budget)} budget</span>
                  <span>{campaign.target_demographic}</span>
                  <span className={`font-medium ${
                    campaign.status === 'active' ? 'text-green-600' : 
                    campaign.status === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <p className="text-sm text-gray-500">No campaigns created yet.</p>
            )}
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

      {/* Campaign Modal */}
      <CampaignModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        campaign={selectedCampaign}
      />
    </div>
  );
};

export default Campaigns;