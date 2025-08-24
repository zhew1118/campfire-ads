import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Campaign {
  id?: string;
  name: string;
  advertiser_id: string;
  budget: number;
  target_demographic: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
  target_categories?: string[];
  targeting_criteria?: {
    categories: string[];
    min_cpm: number;
    max_cpm: number;
    geo_targeting?: string[];
  };
  created_at?: string;
  updated_at?: string;
}

interface CampaignData {
  name: string;
  budget: string;
  target_demographic: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
  categories: string[];
  min_cpm: string;
  max_cpm: string;
  geo_targeting: string;
}

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: any) => void;
  campaign?: Campaign | null;
}

const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  campaign
}) => {
  const [formData, setFormData] = useState<CampaignData>({
    name: '',
    budget: '',
    target_demographic: '',
    status: 'draft',
    start_date: '',
    end_date: '',
    categories: [],
    min_cpm: '',
    max_cpm: '',
    geo_targeting: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const categories = [
    'Technology',
    'Business',
    'Lifestyle', 
    'Education',
    'Health',
    'Entertainment',
    'Sports',
    'News',
    'Comedy',
    'Science'
  ];

  const demographics = [
    '18-24',
    '25-34', 
    '35-44',
    '45-54',
    '55-64',
    '65+',
    'All Ages'
  ];

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        budget: campaign.budget.toString(),
        target_demographic: campaign.target_demographic,
        status: campaign.status,
        start_date: campaign.start_date.split('T')[0], // Convert to YYYY-MM-DD
        end_date: campaign.end_date.split('T')[0],
        categories: campaign.targeting_criteria?.categories || [],
        min_cpm: campaign.targeting_criteria?.min_cpm?.toString() || '',
        max_cpm: campaign.targeting_criteria?.max_cpm?.toString() || '',
        geo_targeting: campaign.targeting_criteria?.geo_targeting?.join(', ') || ''
      });
    } else {
      // Reset form for new campaign
      setFormData({
        name: '',
        budget: '',
        target_demographic: '',
        status: 'draft',
        start_date: '',
        end_date: '',
        categories: [],
        min_cpm: '',
        max_cpm: '',
        geo_targeting: ''
      });
    }
    setErrors({});
  }, [campaign, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Budget must be a positive number';
    }

    if (!formData.target_demographic) {
      newErrors.target_demographic = 'Target demographic is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'At least one category must be selected';
    }

    if (!formData.min_cpm || parseFloat(formData.min_cpm) <= 0) {
      newErrors.min_cpm = 'Minimum CPM must be a positive number';
    }

    if (!formData.max_cpm || parseFloat(formData.max_cpm) <= 0) {
      newErrors.max_cpm = 'Maximum CPM must be a positive number';
    }

    if (formData.min_cpm && formData.max_cpm && parseFloat(formData.min_cpm) >= parseFloat(formData.max_cpm)) {
      newErrors.max_cpm = 'Maximum CPM must be greater than minimum CPM';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Transform form data to API format
      const campaignData = {
        name: formData.name,
        budget: parseFloat(formData.budget),
        target_demographic: formData.target_demographic,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date,
        targeting_criteria: {
          categories: formData.categories,
          min_cpm: parseFloat(formData.min_cpm),
          max_cpm: parseFloat(formData.max_cpm),
          geo_targeting: formData.geo_targeting ? formData.geo_targeting.split(',').map(s => s.trim()).filter(s => s) : []
        }
      };

      await onSave(campaignData);
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {campaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campaign Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Campaign Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter campaign name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Budget */}
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                  Budget ($)
                </label>
                <input
                  type="number"
                  id="budget"
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="0.00"
                />
                {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
              </div>

              {/* Target Demographic */}
              <div>
                <label htmlFor="target_demographic" className="block text-sm font-medium text-gray-700">
                  Target Demographic
                </label>
                <select
                  id="target_demographic"
                  value={formData.target_demographic}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_demographic: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select demographic</option>
                  {demographics.map(demo => (
                    <option key={demo} value={demo}>{demo}</option>
                  ))}
                </select>
                {errors.target_demographic && <p className="mt-1 text-sm text-red-600">{errors.target_demographic}</p>}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
                </div>
              </div>

              {/* Target Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Categories
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {categories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
                {errors.categories && <p className="mt-1 text-sm text-red-600">{errors.categories}</p>}
              </div>

              {/* CPM Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="min_cpm" className="block text-sm font-medium text-gray-700">
                    Min CPM ($)
                  </label>
                  <input
                    type="number"
                    id="min_cpm"
                    min="0"
                    step="0.01"
                    value={formData.min_cpm}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_cpm: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  {errors.min_cpm && <p className="mt-1 text-sm text-red-600">{errors.min_cpm}</p>}
                </div>
                <div>
                  <label htmlFor="max_cpm" className="block text-sm font-medium text-gray-700">
                    Max CPM ($)
                  </label>
                  <input
                    type="number"
                    id="max_cpm"
                    min="0"
                    step="0.01"
                    value={formData.max_cpm}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_cpm: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  {errors.max_cpm && <p className="mt-1 text-sm text-red-600">{errors.max_cpm}</p>}
                </div>
              </div>

              {/* Geographic Targeting */}
              <div>
                <label htmlFor="geo_targeting" className="block text-sm font-medium text-gray-700">
                  Geographic Targeting (optional)
                </label>
                <input
                  type="text"
                  id="geo_targeting"
                  value={formData.geo_targeting}
                  onChange={(e) => setFormData(prev => ({ ...prev, geo_targeting: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="US, Canada, UK (comma-separated)"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (campaign ? 'Update Campaign' : 'Create Campaign')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;