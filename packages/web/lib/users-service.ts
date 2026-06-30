/**
 * Users API service
 */

import { apiClient } from './api-client'

export interface UserProfile {
  id: string
  email: string
  phone: string
  firstName?: string
  lastName?: string
  role: 'FARMER' | 'VET' | 'LAB_TECH' | 'ADMIN'
  createdAt: string
}

export interface FarmerProfile extends UserProfile {
  farmType: string
  animalCount: number
  location?: string
  gpsLatitude?: number
  gpsLongitude?: number
}

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  phone?: string
}

export interface UpdateFarmerProfileInput {
  farmType?: string
  animalCount?: number
  location?: string
  gpsLatitude?: number
  gpsLongitude?: number
}

export const usersService = {
  // Get current user
  async getMe() {
    return apiClient.get('/users/me')
  },

  // Get vets list
  async getVets(availableOnly?: boolean) {
    const params = availableOnly ? '?available=true' : ''
    return apiClient.get(`/users/vets${params}`)
  },

  // Get user profile
  async getProfile(userId: string) {
    return apiClient.get<UserProfile>(`/users/${userId}`)
  },

  // Update user profile
  async updateProfile(input: UpdateProfileInput) {
    return apiClient.put('/users/profile', input)
  },

  // Update farmer profile
  async updateFarmerProfile(input: UpdateFarmerProfileInput) {
    return apiClient.put('/users/farmer-profile', input)
  },

  // Update vet profile
  async updateVetProfile(licenseNumber: string, specialization: string) {
    return apiClient.put('/users/vet-profile', {
      licenseNumber,
      specialization,
    })
  },

  // Search users
  async searchUsers(query: string, role?: string) {
    const params = new URLSearchParams({
      q: query,
      ...(role && { role }),
    })
    return apiClient.get(`/users/search?${params}`)
  },
}

export default usersService
