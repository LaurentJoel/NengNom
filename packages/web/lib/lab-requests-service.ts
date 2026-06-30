/**
 * Lab Requests API service
 */

import { apiClient } from './api-client'

export interface LabRequest {
  id: string
  farmerId: string
  vetId?: string
  testType: string
  gpsLocation: string
  status: 'REQUESTED' | 'SCHEDULED' | 'TECHNICIAN_DISPATCHED' | 'SAMPLES_COLLECTED' | 'ANALYZING' | 'RESULTS_READY' | 'DELIVERED'
  priceQuoted?: number
  scheduledAt?: string
  resultUrl?: string
  vetReview?: string
  instructions?: string
  createdAt: string
  updatedAt: string
}

export interface CreateLabRequestInput {
  testType: string
  gpsLocation: string
  instructions?: string
}

export const labRequestsService = {
  async createRequest(input: CreateLabRequestInput) {
    return apiClient.post<LabRequest>('/lab-requests', input)
  },

  async getRequest(id: string) {
    return apiClient.get<LabRequest>(`/lab-requests/${id}`)
  },

  async listRequests(page = 1, limit = 20) {
    const offset = (page - 1) * limit
    return apiClient.get(`/lab-requests?limit=${limit}&offset=${offset}`)
  },

  async getPendingRequests() {
    return apiClient.get('/lab-requests/pending')
  },

  async updateRequest(
    id: string,
    updates: Partial<LabRequest>
  ) {
    return apiClient.patch(`/lab-requests/${id}`, updates)
  },

  async addVetReview(
    id: string,
    interpretation: string,
    recommendation: string
  ) {
    return apiClient.post(
      `/lab-requests/${id}/vet-review`,
      { interpretation, recommendation }
    )
  },
}

export default labRequestsService
