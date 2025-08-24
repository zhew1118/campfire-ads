import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PodcastData {
  id?: string;
  name: string;
  description: string;
  category: string;
  rss_url?: string;
  artwork_url?: string;
  language: string;
  explicit: boolean;
  status: 'active' | 'paused' | 'archived';
}

interface PodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (podcastData: PodcastData) => Promise<void>;
  podcast?: PodcastData | null;
}

const podcastCategories = [
  'Technology', 'Business', 'News & Politics', 'Comedy', 'Education',
  'Health & Fitness', 'Sports', 'Science', 'Arts', 'Music',
  'True Crime', 'History', 'Society & Culture', 'Religion',
  'Kids & Family', 'Fiction', 'Leisure'
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' }
];

const PodcastModal: React.FC<PodcastModalProps> = ({
  isOpen,
  onClose,
  onSave,
  podcast
}) => {
  const [formData, setFormData] = useState<PodcastData>({
    name: '',
    description: '',
    category: 'Technology',
    rss_url: '',
    artwork_url: '',
    language: 'en',
    explicit: false,
    status: 'active'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Initialize form data when modal opens or podcast changes
  useEffect(() => {
    if (podcast) {
      setFormData({
        id: podcast.id,
        name: podcast.name || '',
        description: podcast.description || '',
        category: podcast.category || 'Technology',
        rss_url: podcast.rss_url || '',
        artwork_url: podcast.artwork_url || '',
        language: podcast.language || 'en',
        explicit: podcast.explicit || false,
        status: podcast.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'Technology',
        rss_url: '',
        artwork_url: '',
        language: 'en',
        explicit: false,
        status: 'active'
      });
    }
    setErrors({});
  }, [podcast, isOpen]);

  const handleInputChange = (field: keyof PodcastData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Podcast name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Podcast name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.rss_url && !isValidUrl(formData.rss_url)) {
      newErrors.rss_url = 'Please enter a valid RSS URL';
    }

    if (formData.artwork_url && !isValidUrl(formData.artwork_url)) {
      newErrors.artwork_url = 'Please enter a valid artwork URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving podcast:', error);
      setErrors({ submit: 'Failed to save podcast. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {podcast ? 'Edit Podcast' : 'Create New Podcast'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {/* Podcast Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Podcast Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter podcast name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your podcast..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Category and Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    {podcastCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RSS URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RSS Feed URL
                </label>
                <input
                  type="url"
                  value={formData.rss_url}
                  onChange={(e) => handleInputChange('rss_url', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.rss_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/podcast/rss"
                />
                {errors.rss_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.rss_url}</p>
                )}
              </div>

              {/* Artwork URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artwork URL
                </label>
                <input
                  type="url"
                  value={formData.artwork_url}
                  onChange={(e) => handleInputChange('artwork_url', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.artwork_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/podcast-artwork.jpg"
                />
                {errors.artwork_url && (
                  <p className="mt-1 text-sm text-red-600">{errors.artwork_url}</p>
                )}
              </div>

              {/* Status and Explicit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.explicit}
                      onChange={(e) => handleInputChange('explicit', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Explicit Content</span>
                  </label>
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                podcast ? 'Update Podcast' : 'Create Podcast'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PodcastModal;