import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('salon_crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401 & 403 Subscription Expired Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        // Token invalid or expired
        localStorage.removeItem('salon_crm_token');
        localStorage.removeItem('salon_crm_user');
      } else if (status === 403 && data.error === 'SUBSCRIPTION_EXPIRED') {
        // Subscription expired notification trigger
        window.dispatchEvent(new CustomEvent('subscription_expired', { detail: data }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
