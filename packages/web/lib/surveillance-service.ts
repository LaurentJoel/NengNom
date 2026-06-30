/**
 * Surveillance API service
 * Disease alerts and regional tracking
 */

import { apiClient } from './api-client'

export interface DiseaseAlert {
  id: string
  reportedById: string
  diseaseName: string
  country: string
  region: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confirmed: boolean
  description?: string
  createdAt: string
}

export interface CreateDiseaseAlertInput {
  diseaseName: string
  country: string
  region: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confirmed?: boolean
  description?: string
}

export const surveillanceService = {
  async createAlert(input: CreateDiseaseAlertInput) {
    return apiClient.post<DiseaseAlert>(
      '/surveillance/disease-alerts',
      input
    )
  },

  async getAlert(id: string) {
    return apiClient.get<DiseaseAlert>(
      `/surveillance/disease-alerts/${id}`
    )
  },

  async listAlerts() {
    return apiClient.get('/surveillance/disease-alerts')
  },

  async getAlertsByRegion(country: string, region: string) {
    return apiClient.get(
      `/surveillance/disease-alerts/by-region/${country}/${region}`
    )
  },

  async getAlertsByCountry(country: string) {
    return apiClient.get(
      `/surveillance/disease-alerts/by-country/${country}`
    )
  },

  async getHighSeverityAlerts(country: string) {
    return apiClient.get(
      `/surveillance/disease-alerts/high-severity/${country}`
    )
  },

  async getDiseaseSummary(country: string) {
    return apiClient.get(
      `/surveillance/disease-summary/${country}`
    )
  },

  async updateAlert(
    id: string,
    updates: Partial<DiseaseAlert>
  ) {
    return apiClient.patch(
      `/surveillance/disease-alerts/${id}`,
      updates
    )
  },
}

export default surveillanceService
