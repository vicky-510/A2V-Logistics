import { getToken, clearToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

let unauthorizedHandler = null;
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearToken();
    unauthorizedHandler?.();
  }
  if (!res.ok) {
    throw new Error(data.error || `Request to ${path} failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  login: (code) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ code }) }),
  dispatch: (message) => request('/api/dispatch', { method: 'POST', body: JSON.stringify({ message }) }),
  disrupt: (shipmentId, eventType, description, blockedEdge) =>
    request('/api/disrupt', { method: 'POST', body: JSON.stringify({ shipmentId, eventType, description, blockedEdge }) }),
  shipments: () => request('/api/shipments'),
  inventory: () => request('/api/shipments/inventory'),
  healingLogs: () => request('/api/shipments/healing-logs'),
  mcpTools: () => request('/api/mcp/tools'),
  logsStreamUrl: () => `${API_BASE}/api/logs/stream?token=${encodeURIComponent(getToken() || '')}`,
};
