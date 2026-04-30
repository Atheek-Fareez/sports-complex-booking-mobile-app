import axios from 'axios';

// The production Render backend URL
const SERVER_URL = 'https://sports-complex-booking-mobile-app.onrender.com'; 
export const BASE_URL = `${SERVER_URL}/api`;

const api = axios.create({
  baseURL: SERVER_URL, // Use the root host as baseURL
});

// Add a request interceptor to ensure /api prefix is always used
api.interceptors.request.use(config => {
  if (config.url && !config.url.startsWith('http')) {
    // Prepend /api if it's missing
    if (!config.url.startsWith('/api') && !config.url.startsWith('api/')) {
      const normalizedPath = config.url.startsWith('/') ? config.url : `/${config.url}`;
      config.url = `/api${normalizedPath}`;
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const serverBase = BASE_URL.replace('/api', '');
  return `${serverBase}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Attach or clear JWT token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

/** Clear all session/auth related data from the app state */
export const clearAuthToken = () => {
  setAuthToken(null);
  // Ensure we don't carry any stale state
  console.log('[SESSION] Session cleared from API headers.');
};

export default api;
