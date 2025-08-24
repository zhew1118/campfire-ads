import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

const AvailableInventoryPreview: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInventoryPreview = async () => {
      try {
        setLoading(true);
        
        // Show sample/popular inventory for dashboard preview
        // In a real system, this would be curated/recommended inventory
        const sampleInventory: InventoryItem[] = [
          {
            id: '1',
            name: 'Tech Talk Daily',
            category: 'Technology',
            description: 'Daily tech news and insights',
            episodeCount: 45,
            availableSlots: 8,
            cpmRange: { min: 15.00, max: 35.00 },
            latestEpisode: 'AI in 2025: What to Expect'
          },
          {
            id: '2', 
            name: 'Business Breakthrough',
            category: 'Business',
            description: 'Entrepreneurship and startup stories',
            episodeCount: 32,
            availableSlots: 5,
            cpmRange: { min: 20.00, max: 45.00 },
            latestEpisode: 'Scaling Your SaaS Business'
          },
          {
            id: '3',
            name: 'Wellness Weekly',
            category: 'Health',
            description: 'Health and wellness tips',
            episodeCount: 28,
            availableSlots: 12,
            cpmRange: { min: 12.00, max: 28.00 },
            latestEpisode: 'Mental Health in the Workplace'
          }
        ];
        
        setInventory(sampleInventory);
      } catch (error) {
        console.error('Failed to load inventory preview:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInventoryPreview();
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Available Inventory</h3>
        <Link to="/inventory" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All →
        </Link>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading inventory...</span>
        </div>
      ) : (
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No inventory available at the moment.
                  </td>
                </tr>
              ) : (
                inventory.slice(0, 3).map((item) => ( // Show first 3 items as preview
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.latestEpisode || `${item.episodeCount} episodes`}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AvailableInventoryPreview;