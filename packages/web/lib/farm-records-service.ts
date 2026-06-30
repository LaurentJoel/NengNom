/**
 * Farm Records API service
 */

import { apiClient } from './api-client'

export interface FarmRecord {
  id: string
  farmerId: string
  recordDate: string
  animalCount: number
  mortalityCount: number
  feedConsumedKg: number
  expenses: number
  revenue: number
  notes?: string
  createdAt: string
}

export interface MonthlyStats {
  month: number
  year: number
  avgAnimalCount: number
  mortalityRate: number
  totalExpenses: number
  totalRevenue: number
}

export interface CreateFarmRecordInput {
  recordDate: string
  animalCount: number
  mortalityCount: number
  feedConsumedKg: number
  expenses: number
  revenue: number
  notes?: string
}

export const farmRecordsService = {
  // Records
  async createRecord(input: CreateFarmRecordInput) {
    return apiClient.post<FarmRecord>('/farm-records', input)
  },

  async getRecord(id: string) {
    return apiClient.get<FarmRecord>(`/farm-records/${id}`)
  },

  async listRecords(page = 1, limit = 20) {
    const offset = (page - 1) * limit
    return apiClient.get(`/farm-records?limit=${limit}&offset=${offset}`)
  },

  async updateRecord(
    id: string,
    updates: Partial<CreateFarmRecordInput>
  ) {
    return apiClient.patch(`/farm-records/${id}`, updates)
  },

  async deleteRecord(id: string) {
    return apiClient.delete(`/farm-records/${id}`)
  },

  // Stats
  async getMonthlyStats(year: number, month: number) {
    return apiClient.get<MonthlyStats>(
      `/farm-records/stats/${year}/${month}`
    )
  },
}

export default farmRecordsService
