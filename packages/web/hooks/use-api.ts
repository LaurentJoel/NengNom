/**
 * Custom hook for API calls with error handling
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  showNotification?: boolean
}

/**
 * Custom hook for making API calls
 * Handles loading, error, and success states
 */
export function useApi(
  apiCall: (args?: any) => Promise<any>,
  options: UseApiOptions = {}
) {
  const { onSuccess, onError, showNotification = true } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  const execute = useCallback(
    async (args?: any) => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiCall(args)

        if (!response.success) {
          const errorMessage =
            response.error?.message || 'An error occurred'
          setError(errorMessage)

          if (showNotification) {
            toast.error(errorMessage)
          }

          onError?.(response.error)
          return { success: false, error: response.error }
        }

        setData(response.data)

        if (showNotification && options.onSuccess) {
          toast.success('Operation successful')
        }

        onSuccess?.(response.data)
        return response
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)

        if (showNotification) {
          toast.error(errorMessage)
        }

        onError?.(err)
        return { success: false, error: err }
      } finally {
        setLoading(false)
      }
    },
    [apiCall, onSuccess, onError, showNotification]
  )

  return { loading, error, data, execute }
}

export default useApi
