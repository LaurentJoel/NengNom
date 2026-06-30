/**
 * Authentication API service
 * Handles login, register, logout, and token refresh
 */

import { apiClient } from './api-client'

export interface AuthResponse {
  success: boolean
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    phone?: string
    role: 'FARMER' | 'VET' | 'LAB_TECH' | 'ADMIN'
  }
}

export interface RegisterInput {
  phone: string
  email?: string
  password: string
  confirmPassword?: string
  fullName: string
  role: 'FARMER' | 'VET'
  country?: string
  region?: string
}

export interface LoginInput {
  phone: string
  password: string
}

/**
 * Auth service - handles authentication flows
 */
export const authService = {
  /**
   * Register new user
   */
  async register(input: RegisterInput) {
    return apiClient.post<AuthResponse>('/auth/register', input)
  },

  /**
   * Login user
   */
  async login(input: LoginInput) {
    return apiClient.post<AuthResponse>('/auth/login', input)
  },

  /**
   * Logout user (invalidate refresh token)
   */
  async logout() {
    return apiClient.post('/auth/logout')
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    return apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    })
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    return apiClient.get('/users/me')
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: Record<string, any>) {
    return apiClient.put('/users/profile', updates)
  },

  /**
   * Store tokens in localStorage
   */
  storeTokens(accessToken: string, refreshToken: string) {
    apiClient.setToken(accessToken)
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', refreshToken)
    }
  },

  /**
   * Clear authentication
   */
  logout_client() {
    apiClient.clearToken()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('accessToken')
    }
  },
}

export default authService
