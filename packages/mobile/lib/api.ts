import { storage } from './storage';

// 10.0.2.2 = host machine localhost from Android emulator
export const API_URL = 'http://10.0.2.2:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<ApiResponse<T>> {
  const resolvedToken = token ?? (await storage.getToken());

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const json = await res.json();

    if (res.ok) {
      return { success: true, data: json.data ?? json };
    }

    if (res.status === 401) {
      await storage.clear();
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
  patch:  <T = any>(path: string, body?: object) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),

  // Auth-free call for login
  postPublic: <T = any>(path: string, body: object) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, ''),
};
