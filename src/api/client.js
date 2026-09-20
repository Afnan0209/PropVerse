import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

// If you add login later: localStorage.setItem('pv_token', token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Your routes answer {"status": "success", "data": [...]}; a plain array also works
const unwrap = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

export const getRows = async (path) => unwrap((await api.get(path)).data);
export const postJson = (path, body) => api.post(path, body);

export function errorMessage(err) {
  if (!err.response) {
    return `Cannot reach the backend at ${API_URL}. Check that uvicorn is running and CORS allows this address.`;
  }
  const detail = err.response.data?.detail;
  const text = Array.isArray(detail)
    ? detail.map((d) => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`).join('; ')
    : typeof detail === 'string' ? detail : err.response.statusText;
  return `${err.response.status}: ${text}`;
}
