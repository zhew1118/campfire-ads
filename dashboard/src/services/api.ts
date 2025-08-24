import axios, { AxiosInstance } from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: '/api', // This will proxy to API Gateway via Vite
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Authentication
  login: (email: string, password: string, role: string) =>
    api.post('/auth/login', { email, password, role }),

  // Podcasts
  getPodcasts: () => api.get('/podcasts?page=1&limit=20&sort=desc&sortBy=created_at'),
  getPodcast: (id: string) => api.get(`/podcasts/${id}`),
  createPodcast: (data: any) => api.post('/podcasts', data),
  updatePodcast: (id: string, data: any) => api.put(`/podcasts/${id}`, data),
  deletePodcast: (id: string) => api.delete(`/podcasts/${id}`),

  // Episodes
  getEpisodes: (podcastId: string) => api.get(`/podcasts/${podcastId}/episodes?page=1&limit=20&sort=desc&sortBy=created_at`),
  getEpisode: (episodeId: string) => api.get(`/episodes/${episodeId}`),
  createEpisode: (podcastId: string, data: any) => api.post(`/podcasts/${podcastId}/episodes`, data),
  updateEpisode: (episodeId: string, data: any) => api.put(`/episodes/${episodeId}`, data),
  deleteEpisode: (episodeId: string) => api.delete(`/episodes/${episodeId}`),

  // Ad Slots
  getAdSlots: (episodeId: string) => api.get(`/episodes/${episodeId}/slots?page=1&limit=20&sort=desc&sortBy=created_at`),
  getAdSlot: (slotId: string) => api.get(`/slots/${slotId}`),
  createAdSlot: (episodeId: string, data: any) => api.post(`/episodes/${episodeId}/slots`, data),
  updateAdSlot: (slotId: string, data: any) => api.put(`/slots/${slotId}`, data),
  deleteAdSlot: (slotId: string) => api.delete(`/slots/${slotId}`),

  // Advertisers
  getAdvertisers: () => api.get('/advertisers'),
  createAdvertiser: (data: any) => api.post('/advertisers', data),
  updateAdvertiser: (id: string, data: any) => api.put(`/advertisers/${id}`, data),
  deleteAdvertiser: (id: string) => api.delete(`/advertisers/${id}`),

  // Campaigns
  getCampaigns: (page = 1, limit = 20) => api.get(`/campaigns?page=${page}&limit=${limit}&sort=desc&sortBy=created_at`),
  createCampaign: (data: any) => api.post('/campaigns', data),
  updateCampaign: (id: string, data: any) => api.put(`/campaigns/${id}`, data),
  deleteCampaign: (id: string) => api.delete(`/campaigns/${id}`),

  // Inventory
  getInventory: () => api.get('/inventory'),
  searchInventory: (queryParams: string) => api.get(`/inventory/search?${queryParams}`),
  createInventory: (data: any) => api.post('/inventory', data),
  updateInventory: (id: string, data: any) => api.put(`/inventory/${id}`, data),
  deleteInventory: (id: string) => api.delete(`/inventory/${id}`),

  // Analytics
  getAnalytics: (params?: any) => api.get('/analytics/reports', { params }),
  getCampaignAnalytics: (id: string, params?: any) =>
    api.get(`/analytics/reports/campaign/${id}`, { params }),
  getPodcasterAnalytics: (id: string, params?: any) =>
    api.get(`/analytics/reports/podcaster/${id}`, { params }),
  getAdvertiserAnalytics: (id: string, params?: any) =>
    api.get(`/analytics/reports/advertiser/${id}`, { params }),
};

export default api;