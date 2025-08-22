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

  // Podcasters
  getPodcasters: () => api.get('/podcasters'),
  createPodcaster: (data: any) => api.post('/podcasters', data),
  updatePodcaster: (id: string, data: any) => api.put(`/podcasters/${id}`, data),
  deletePodcaster: (id: string) => api.delete(`/podcasters/${id}`),

  // Advertisers
  getAdvertisers: () => api.get('/advertisers'),
  createAdvertiser: (data: any) => api.post('/advertisers', data),
  updateAdvertiser: (id: string, data: any) => api.put(`/advertisers/${id}`, data),
  deleteAdvertiser: (id: string) => api.delete(`/advertisers/${id}`),

  // Campaigns
  getCampaigns: () => api.get('/campaigns'),
  createCampaign: (data: any) => api.post('/campaigns', data),
  updateCampaign: (id: string, data: any) => api.put(`/campaigns/${id}`, data),
  deleteCampaign: (id: string) => api.delete(`/campaigns/${id}`),

  // Inventory
  getInventory: () => api.get('/inventory'),
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