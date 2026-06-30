/**
 * AI Suggestions API service
 */

import { apiClient } from './api-client'

export interface AiSuggestion {
  id: string
  farmerId: string
  suggestion: any // Array of suggestions with title, content, priority
  wasHelpful?: boolean
  generatedAt: string
}

export const aiService = {
  async getSuggestions() {
    return apiClient.get<AiSuggestion[]>('/ai/suggestions')
  },

  async getLatestSuggestion() {
    return apiClient.get<AiSuggestion>('/ai/suggestions/latest')
  },

  async generateSuggestions() {
    return apiClient.post<AiSuggestion>('/ai/suggestions/generate')
  },

  async rateSuggestion(id: string, helpful: boolean) {
    return apiClient.post(`/ai/suggestions/${id}/feedback`, { helpful })
  },
}

export default aiService
