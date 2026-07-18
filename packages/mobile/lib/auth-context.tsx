import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from './storage';
import { api, setForceLogoutCallback } from './api';

export interface AuthUser {
  id: string;
  phone: string;
  fullName: string;
  role: 'FARMER' | 'VET' | 'ADMIN';
  email?: string;
  country?: string;
  region?: string;
  isVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [storedToken, storedUser] = await Promise.all([
        storage.getToken(),
        storage.getUser<AuthUser>(),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
      setIsLoading(false);
    })();
  }, []);

  // Register force-logout callback so api.ts can reset auth state when refresh fails
  useEffect(() => {
    setForceLogoutCallback(async () => {
      await storage.clear();
      setToken(null);
      setUser(null);
    });
  }, []);

  const login = useCallback(async (phone: string, password: string): Promise<AuthUser> => {
    const res = await api.postPublic<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/login',
      { phone, password },
    );

    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Identifiants incorrects');
    }

    const { accessToken, refreshToken, user: authUser } = res.data;
    await storage.setToken(accessToken);
    if (refreshToken) await storage.setRefreshToken(refreshToken);
    await storage.setUser(authUser);
    setToken(accessToken);
    setUser(authUser);
    return authUser;
  }, []);

  const logout = useCallback(async () => {
    await storage.clear();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
