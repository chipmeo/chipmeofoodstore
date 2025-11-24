// Default to the production API hostname when no env var is provided.
// This makes the frontend call the live API at api.chipmeo.io.vn by default
// (useful if you deploy the frontend without setting env vars). For local
// development set `NEXT_PUBLIC_API_BASE_URL=http://localhost:2908` in
// `FRONTEND/.env.local`.
const API_BASE = 'https://api.chipmeo.io.vn';

async function request(path: string, opts: RequestInit = {}) {
  const url = API_BASE ? `${API_BASE.replace(/\/$/, '')}${path.startsWith('/')? path : '/'+path}` : path;
  const res = await fetch(url, Object.assign({
    headers: { 'Content-Type': 'application/json' }
  }, opts));
  if (!res.ok) {
    const text = await res.text();
    const msg = `${res.status} ${res.statusText}: ${text}`;
    // include request url in error to aid debugging in browser console
    throw new Error(`Request failed: ${url} -> ${msg}`);
  }
  // try parse json, but some endpoints may return empty body
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export async function fetchMenu() {
  return request('/api/menu', { method: 'GET' });
}

export async function createMenuItem(payload: any) {
  return request('/api/menu', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateMenuItem(id: number|string, payload: any) {
  return request(`/api/menu/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteMenuItem(id: number|string) {
  return request(`/api/menu/${id}`, { method: 'DELETE' });
}

export async function createOrder(payload: any) {
  return request('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
}

export default { fetchMenu, createMenuItem, updateMenuItem, deleteMenuItem, createOrder };
