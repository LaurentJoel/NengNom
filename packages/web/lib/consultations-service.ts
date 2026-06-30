/**
 * Consultations API service
 */

import { apiClient } from './api-client'

export interface Consultation {
  id: string
  farmerId: string
  vetId?: string
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'CANCELLED'
  type: 'CHAT' | 'VOICE' | 'VIDEO' | 'EMERGENCY'
  symptomsDescription?: string
  issue?: string
  mediaUrls?: string[]
  prescription?: string
  fee?: number
  startedAt?: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateConsultationInput {
  issue?: string
  symptomsDescription?: string
  type: 'CHAT' | 'VOICE' | 'VIDEO' | 'EMERGENCY'
  vetId?: string
  mediaUrls?: string[]
}

export interface Message {
  id: string
  consultationId: string
  senderId: string
  senderRole?: 'FARMER' | 'VET'
  content: string
  mediaUrl?: string
  sentAt: string
}

export const consultationsService = {
  // Consultations
  async createConsultation(input: CreateConsultationInput) {
    return apiClient.post<Consultation>('/consultations', {
      vetId: input.vetId,
      type: input.type,
      symptomsDescription: input.symptomsDescription || input.issue,
      mediaUrls: input.mediaUrls || [],
    })
  },

  async getConsultation(id: string) {
    return apiClient.get<Consultation>(`/consultations/${id}`)
  },

  async listConsultations(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (status) params.set('status', status)
    return apiClient.get(`/consultations?${params}`)
  },

  async updateConsultation(
    id: string,
    updates: Partial<Consultation>
  ) {
    return apiClient.patch(`/consultations/${id}`, updates)
  },

  // Messages
  async sendMessage(
    consultationId: string,
    content: string,
    attachmentUrl?: string
  ) {
    return apiClient.post<Message>(
      `/consultations/${consultationId}/messages`,
      { content, attachmentUrl }
    )
  },

  async getMessages(consultationId: string) {
    return apiClient.get<Message[]>(
      `/consultations/${consultationId}/messages`
    )
  },
}

export default consultationsService
