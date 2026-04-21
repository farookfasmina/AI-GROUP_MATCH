import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// Intercept requests to attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('study_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
