/**
 * API Client for Neng-Nom Backend
 * Handles authentication, requests, and error responses
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  requestId?: string
  timestamp?: string
}

interface ApiRequestOptions extends RequestInit {
  timeout?: number
  retries?: number
}

/**
 * API Client class for making authenticated requests
 */
class ApiClient {
  private token: string | null = null

  constructor() {
    // Try to load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken')
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Make an API request
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = API_TIMEOUT, retries = 3, ...fetchOptions } = options

    const url = `${API_URL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    }

    // Add authorization token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    let lastError: Error | null = null

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type')
        let data: any

        if (contentType?.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text()
        }

        // Handle successful responses
        if (response.ok) {
          return {
            success: true,
            data: data.data || data,
            requestId: response.headers.get('x-request-id') || undefined,
          }
        }

        // Handle error responses
        if (response.status === 401) {
          // Unauthorized - clear token
          this.clearToken()
          throw new Error('Unauthorized. Please login again.')
        }

        // Don't retry on 4xx errors (except 408, 429)
        if (response.status >= 400 && response.status < 500) {
          if (response.status !== 408 && response.status !== 429) {
            return {
              success: false,
              error: data.error || {
                code: `HTTP_${response.status}`,
                message: data.message || 'Request failed',
                details: data.details,
              },
              requestId: response.headers.get('x-request-id') || undefined,
            }
          }
        }

        // For 5xx errors, retry with backoff
        throw new Error(`HTTP ${response.status}`)
      } catch (error) {
        lastError = error as Error

        // Don't retry if it's the last attempt
        if (attempt === retries - 1) {
          break
        }

        // Exponential backoff: 1s, 2s, 4s...
        const delayMs = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    // All retries exhausted
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: lastError?.message || 'Failed to reach server',
      },
    }
  }

  /**
   * GET request
   */
  get<T = any>(endpoint: string, options?: ApiRequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  /**
   * POST request
   */
  post<T = any>(
    endpoint: string,
    body?: Record<string, any>,
    options?: ApiRequestOptions
  ) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PATCH request
   */
  patch<T = any>(
    endpoint: string,
    body?: Record<string, any>,
    options?: ApiRequestOptions
  ) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PUT request
   */
  put<T = any>(
    endpoint: string,
    body?: Record<string, any>,
    options?: ApiRequestOptions
  ) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETE request
   */
  delete<T = any>(endpoint: string, options?: ApiRequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

export default apiClient
