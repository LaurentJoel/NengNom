import { storage } from './storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// Registered by AuthProvider so a failed refresh can reset auth state in the UI
let _onForceLogout: (() => void) | null = null;
export function setForceLogoutCallback(cb: () => void) { _onForceLogout = cb; }

// Single shared promise so concurrent 401s don't each fire a separate refresh
let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.accessToken) return null;
    await storage.setToken(json.accessToken);
    if (json.refreshToken) await storage.setRefreshToken(json.refreshToken);
    return json.accessToken;
  } catch {
    return null;
  }
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<ApiResponse<T>> {
  const resolvedToken = token ?? (await storage.getToken());

  const hasBody = options.body !== undefined && options.body !== null;
  const headers: Record<string, string> = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const json = await res.json();

    if (res.ok) return { success: true, data: json.data ?? json };

    if (res.status === 401 && resolvedToken) {
      // Deduplicate concurrent refresh attempts
      if (!_refreshPromise) {
        _refreshPromise = refreshAccessToken().finally(() => { _refreshPromise = null; });
      }
      const newToken = await _refreshPromise;

      if (newToken) {
        // Retry original request with fresh token
        try {
          const retryRes = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: { ...headers, Authorization: `Bearer ${newToken}` },
          });
          const retryJson = await retryRes.json();
          if (retryRes.ok) return { success: true, data: retryJson.data ?? retryJson };
          return {
            success: false,
            error: retryJson.error || { code: `HTTP_${retryRes.status}`, message: retryJson.message || 'Erreur serveur' },
          };
        } catch {
          return { success: false, error: { code: 'NETWORK', message: 'Serveur inaccessible' } };
        }
      }

      // Refresh failed → clear session and notify UI
      await storage.clear();
      _onForceLogout?.();
    }

    return {
      success: false,
      error: json.error || { code: `HTTP_${res.status}`, message: json.message || 'Erreur serveur' },
    };
  } catch (err: any) {
    return { success: false, error: { code: 'NETWORK', message: 'Serveur inaccessible' } };
  }
}

export const api = {
  get:    <T = any>(path: string) => request<T>(path, { method: 'GET' }),
  post:   <T = any>(path: string, body?: object) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put:    <T = any>(path: string, body?: object) => request<T>(path, { method: 'PUT',  body: body ? JSON.stringify(body) : undefined }),
  patch:  <T = any>(path: string, body?: object) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),

  // Auth-free call for login/register
  postPublic: <T = any>(path: string, body: object) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, ''),

  uploadFormData: async <T = any>(path: string, formData: FormData): Promise<ApiResponse<T>> => {
    const token = await storage.getToken();
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (res.ok) return { success: true, data: json.data ?? json };
      return { success: false, error: json.error || { code: `HTTP_${res.status}`, message: json.message || 'Erreur serveur' } };
    } catch {
      return { success: false, error: { code: 'NETWORK', message: 'Serveur inaccessible' } };
    }
  },
};
