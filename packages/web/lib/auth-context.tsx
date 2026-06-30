'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { apiClient } from './api-client'
import { authService } from './auth-service'

export type UserRole = 'FARMER' | 'VET' | 'LAB_TECH' | 'ADMIN'

export interface AuthUser {
  id: string
  email?: string
  fullName: string
  role: UserRole
  isVerified: boolean
  country?: string
  region?: string
  phone?: string
  createdAt?: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (phone: string, password: string) => Promise<AuthUser>
  register: (input: RegisterInput) => Promise<AuthUser>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

interface RegisterInput {
  phone: string
  email?: string
  password: string
  confirmPassword: string
  role: 'FARMER' | 'VET'
  fullName: string
  country?: string
  region?: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      apiClient.setToken(token)
      authService.getCurrentUser().then((res) => {
        if (res.success && res.data) {
          setUser(res.data as AuthUser)
        } else {
          apiClient.clearToken()
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (phone: string, password: string): Promise<AuthUser> => {
    const res = await authService.login({ phone, password })
    if (!res.success || !res.data) {
      throw new Error((res.error as any)?.message || 'Login failed')
    }
    const { accessToken, refreshToken, user: userData } = res.data as any
    authService.storeTokens(accessToken, refreshToken)
    setUser(userData as AuthUser)
    return userData as AuthUser
  }, [])

  const register = useCallback(async (input: RegisterInput): Promise<AuthUser> => {
    const res = await authService.register(input as any)
    if (!res.success || !res.data) {
      throw new Error((res.error as any)?.message || 'Registration failed')
    }
    const { accessToken, refreshToken, user: userData } = res.data as any
    authService.storeTokens(accessToken, refreshToken)
    setUser(userData as AuthUser)
    return userData as AuthUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (err) {
      console.warn('Server-side logout failed; refresh token may remain active:', err)
    }
    authService.logout_client()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
