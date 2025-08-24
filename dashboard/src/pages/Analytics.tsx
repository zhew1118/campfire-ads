import { ChartBarIcon, ArrowTrendingUpIcon, EyeIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface AnalyticsData {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpm: number;
  conversions: number;
}

interface CampaignAnalytics {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  status: string;
}

const Analytics: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Loading analytics data...');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  
  // Sample data - will be replaced with real API calls
  const [analyticsData] = useState<AnalyticsData>({
    impressions: 156789,
    clicks: 4231,
    spend: 5678.90,
    ctr: 2.7,
    cpm: 25.43,
    conversions: 189
  });

  const [campaignAnalytics] = useState<CampaignAnalytics[]>([
    {
      id: '1',
      name: 'Tech Podcast Summer Campaign',
      impressions: 89567,
      clicks: 2341,
      spend: 3245.67,
      ctr: 2.6,
      status: 'active'
    },
    {
      id: '2',
      name: 'Morning Show Ads',
      impressions: 67222,
      clicks: 1890,
      spend: 2433.23,
      ctr: 2.8,
      status: 'active'
    }
  ]);

  const [topPodcasts] = useState([
    { name: 'Tech News Weekly', impressions: 23456, ctr: 3.2 },
    { name: 'Morning Coffee Talk', impressions: 18922, ctr: 2.9 },
    { name: 'Business Insights', impressions: 15678, ctr: 2.4 },
    { name: 'Startup Stories', impressions: 12334, ctr: 3.1 },
  ]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        // TODO: Implement real analytics API calls
        // const response = await apiService.getAnalytics({ timeRange, campaign: selectedCampaign });
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setApiStatus('✅ Analytics data loaded successfully!');
      } catch (error: any) {
        if (error.response?.status === 401) {
          setApiStatus('❌ Authentication required - please login');
        } else {
          setApiStatus(`⚠️ Error loading analytics: ${error.response?.data?.error || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, [timeRange, selectedCampaign]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Analytics</h1>
          <p className="text-gray-600">Track your advertising campaign performance (Demand Side)</p>
          <p className="text-sm mt-2">{apiStatus}</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Campaigns</option>
            {campaignAnalytics.map(campaign => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Impressions</h3>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.impressions)}</p>
              <p className="text-sm text-green-600">+12.5% vs last period</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CursorArrowRaysIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.clicks)}</p>
              <p className="text-sm text-green-600">+8.3% vs last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Click-Through Rate</h3>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.ctr}%</p>
              <p className="text-sm text-green-600">Above industry avg (2.1%)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Spend</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.spend)}</p>
              <p className="text-sm text-gray-600">68% of total budget</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold text-sm">CPM</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Average CPM</h3>
              <p className="text-2xl font-bold text-gray-900">${analyticsData.cpm}</p>
              <p className="text-sm text-green-600">12% below target</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold text-sm">CV</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Conversions</h3>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.conversions}</p>
              <p className="text-sm text-green-600">+15.2% vs last period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
          <p className="text-sm text-gray-600">{getTimeRangeLabel(timeRange)}</p>
        </div>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading campaign analytics...
                  </td>
                </tr>
              ) : (
                campaignAnalytics.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(campaign.impressions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(campaign.clicks)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.ctr}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(campaign.spend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Podcasts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Podcasts</h3>
          <div className="space-y-4">
            {topPodcasts.map((podcast, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{podcast.name}</div>
                    <div className="text-sm text-gray-500">{formatNumber(podcast.impressions)} impressions</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-green-600">
                  {podcast.ctr}% CTR
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="text-sm font-medium text-gray-900">Strong CTR Performance</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your campaigns are performing 28% above industry average (2.1% vs 2.7%)
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="text-sm font-medium text-gray-900">Optimal Spend Efficiency</h4>
              <p className="text-sm text-gray-600 mt-1">
                Tech podcast targeting shows highest conversion rates at $25 CPM
              </p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="text-sm font-medium text-gray-900">Growth Opportunity</h4>
              <p className="text-sm text-gray-600 mt-1">
                Morning shows (6-9 AM) have 35% higher engagement rates
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="text-sm font-medium text-gray-900">Budget Optimization</h4>
              <p className="text-sm text-gray-600 mt-1">
                Consider increasing budget for "Tech News Weekly" - highest ROI
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Performance Over Time</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-md">
              Impressions
            </button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
              Clicks
            </button>
            <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
              Spend
            </button>
          </div>
        </div>
        
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <h4 className="text-lg font-medium text-gray-900">Performance Chart</h4>
            <p className="text-sm text-gray-600">Interactive charts will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;