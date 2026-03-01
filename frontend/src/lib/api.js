import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
  uploadPhoto: (photoBase64) => {
    const formData = new FormData();
    formData.append('photo_base64', photoBase64);
    return api.post('/auth/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Users API
export const usersAPI = {
  getAll: (includeInactive = false) => api.get('/users', { params: { include_inactive: includeInactive } }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.patch(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  changePassword: (id, newPassword) => api.post(`/users/${id}/change-password`, { new_password: newPassword }),
};

// Assets API
export const assetsAPI = {
  getAll: (params = {}) => api.get('/assets', { params }),
  getMy: () => api.get('/assets/my'),
  getById: (id) => api.get(`/assets/${id}`),
  create: (assetData) => api.post('/assets', assetData),
  update: (id, assetData) => api.patch(`/assets/${id}`, assetData),
  delete: (id) => api.delete(`/assets/${id}`),
  assign: (data) => api.post('/assets/assign', data),
  bulkAssign: (data) => api.post('/assets/bulk-assign', data),
  returnAsset: (id) => api.post(`/assets/${id}/return`),
};

// Service Requests API
export const serviceRequestsAPI = {
  getAll: (params = {}) => api.get('/service-requests', { params }),
  getMy: () => api.get('/service-requests/my'),
  create: (requestData) => api.post('/service-requests', requestData),
  update: (id, updateData) => api.patch(`/service-requests/${id}`, updateData),
  resolve: (id) => api.post(`/service-requests/${id}/resolve`),
};

// Asset Requests API
export const assetRequestsAPI = {
  getAll: (params = {}) => api.get('/asset-requests', { params }),
  getMy: () => api.get('/asset-requests/my'),
  create: (requestData) => api.post('/asset-requests', requestData),
  update: (id, status, adminRemarks = null) => 
    api.patch(`/asset-requests/${id}`, null, { params: { status, admin_remarks: adminRemarks } }),
};

// Consumables API
export const consumablesAPI = {
  getAll: (params = {}) => api.get('/consumables', { params }),
  getMy: () => api.get('/consumables/my'),
  create: (orderData) => api.post('/consumables', orderData),
  createDirect: (orderData) => api.post('/consumables/direct', orderData),
  update: (id, updateData) => api.patch(`/consumables/${id}`, updateData),
  delete: (id) => api.delete(`/consumables/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (unreadOnly = false) => api.get('/notifications', { params: { unread_only: unreadOnly } }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Activity Logs API
export const activityLogsAPI = {
  getAll: (params = {}) => api.get('/activity-logs', { params }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getUserStats: () => api.get('/dashboard/user-stats'),
};

// Return Requests API
export const returnRequestsAPI = {
  getAll: (params = {}) => api.get('/return-requests', { params }),
  update: (id, status) => api.patch(`/return-requests/${id}`, null, { params: { status } }),
};

// Initialize API
export const initAPI = {
  initialize: () => api.post('/init'),
};

export default api;
