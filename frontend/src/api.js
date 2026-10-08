import axios from 'axios';

// Same address as the website in production; Vite forwards /api to the backend in development.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api/v1' });

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('study_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    /* storage blocked - continue signed out */
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      try { localStorage.removeItem('study_token'); } catch { /* ignore */ }
      window.dispatchEvent(new Event('sm:signed-out'));
    }
    return Promise.reject(err);
  },
);

// Turn any API error into one plain sentence for the screen.
export function errorText(err, fallback = 'Something went wrong - please try again.') {
  if (!err?.response) return 'Cannot reach the server - check your connection.';
  const detail = err.response.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    const d = detail[0];
    const field = Array.isArray(d.loc) ? String(d.loc[d.loc.length - 1]).replace(/_/g, ' ') : '';
    return `${field ? `${field}: ` : ''}${(d.msg || '').replace(/^Value error, /, '')}`;
  }
  return fallback;
}

export async function downloadFile(path, filename) {
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default api;
