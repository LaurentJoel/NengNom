import { apiClient } from './api-client'

export const adminService = {
  async getStats() {
    return apiClient.get('/admin/stats')
  },

  async listUsers(page = 1, limit = 20, role?: string, q?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (role) params.set('role', role)
    if (q) params.set('q', q)
    return apiClient.get(`/admin/users?${params}`)
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    return apiClient.patch(`/admin/users/${userId}/status`, { isActive })
  },

  async listConsultations(page = 1, limit = 20, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    return apiClient.get(`/admin/consultations?${params}`)
  },

  async listAlerts() {
    return apiClient.get('/admin/alerts')
  },

  async createAlert(input: {
    diseaseName: string
    region: string
    country: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    isConfirmed: boolean
  }) {
    return apiClient.post('/admin/alerts', input)
  },

  async deleteAlert(id: string) {
    return apiClient.delete(`/admin/alerts/${id}`)
  },

  async deleteCommunityPost(id: string) {
    return apiClient.delete(`/admin/community/posts/${id}`)
  },
}
