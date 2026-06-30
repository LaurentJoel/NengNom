/**
 * Community API service
 * Q&A, tips, alerts, marketplace
 */

import { apiClient } from './api-client'

export interface CommunityPost {
  id: string
  authorId: string
  authorName?: string
  title?: string
  content: string
  category: 'QUESTION' | 'ALERT' | 'TIP' | 'SALE'
  tags: string[]
  mediaUrls?: string[]
  likesCount: number
  isAnonymous: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePostInput {
  title?: string
  content: string
  category: 'QUESTION' | 'ALERT' | 'TIP' | 'SALE'
  tags?: string[]
  mediaUrls?: string[]
  isAnonymous?: boolean
}

export const communityService = {
  async createPost(input: CreatePostInput) {
    return apiClient.post<CommunityPost>('/community/posts', input)
  },

  async getPost(id: string) {
    return apiClient.get<CommunityPost>(`/community/posts/${id}`)
  },

  async listPosts(
    category?: string,
    limit = 20,
    offset = 0
  ) {
    const query = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(category && { category }),
    })
    return apiClient.get(`/community/posts?${query}`)
  },

  async searchPosts(query: string) {
    return apiClient.get(
      `/community/posts/search?q=${encodeURIComponent(query)}`
    )
  },

  async getTrendingTopics(days = 7) {
    return apiClient.get(`/community/trending?days=${days}`)
  },

  async likePost(postId: string) {
    return apiClient.post(`/community/posts/${postId}/like`)
  },

  async unlikePost(postId: string) {
    return apiClient.delete(`/community/posts/${postId}/like`)
  },

  async updatePost(
    id: string,
    updates: Partial<CreatePostInput>
  ) {
    return apiClient.patch(`/community/posts/${id}`, updates)
  },

  async deletePost(id: string) {
    return apiClient.delete(`/community/posts/${id}`)
  },
}

export default communityService
