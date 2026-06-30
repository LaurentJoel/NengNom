/**
 * Health Events API service
 * Vaccinations, deworming, treatments, reminders
 */

import { apiClient } from './api-client'

export interface HealthEvent {
  id: string
  farmerId: string
  eventType: string
  animalGroup?: string
  productUsed?: string
  eventDate: string
  nextDueDate?: string
  notes?: string
  createdAt: string
}

export interface CreateHealthEventInput {
  eventType: string
  animalGroup?: string
  productUsed?: string
  eventDate: string
  nextDueDate?: string
  notes?: string
}

export const healthEventsService = {
  async createEvent(input: CreateHealthEventInput) {
    return apiClient.post<HealthEvent>('/health-events', input)
  },

  async getEvent(id: string) {
    return apiClient.get<HealthEvent>(`/health-events/${id}`)
  },

  async listEvents(page = 1, limit = 20) {
    const offset = (page - 1) * limit
    return apiClient.get(`/health-events?limit=${limit}&offset=${offset}`)
  },

  async getReminders() {
    return apiClient.get<HealthEvent[]>('/health-events/reminders')
  },

  async updateEvent(
    id: string,
    updates: Partial<CreateHealthEventInput>
  ) {
    return apiClient.patch(`/health-events/${id}`, updates)
  },

  async deleteEvent(id: string) {
    return apiClient.delete(`/health-events/${id}`)
  },
}

export default healthEventsService
