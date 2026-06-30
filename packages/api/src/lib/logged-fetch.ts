import { createLogger } from './logger.js'

const log = createLogger('external-service')

export interface LoggedCallContext {
  [key: string]: unknown
}

/**
 * Wrap external API calls with consistent logging
 * Logs latency, success/failure, and context for observability
 *
 * Usage:
 * ```
 * await loggedCall('groq.completion', () => groq.chat(...), {
 *   farmerId,
 *   model,
 *   promptLength: 850
 * })
 * ```
 */
export async function loggedCall<T>(
  serviceName: string,
  fn: () => Promise<T>,
  context: LoggedCallContext = {}
): Promise<T> {
  const start = Date.now()

  try {
    const result = await fn()
    const latencyMs = Date.now() - start

    log.info(`${serviceName} call succeeded`, {
      service: serviceName,
      latencyMs,
      ...context,
    })

    return result
  } catch (error) {
    const latencyMs = Date.now() - start

    log.error(`${serviceName} call failed`, {
      service: serviceName,
      latencyMs,
      error: (error as Error).message,
      errorCode: (error as any).code,
      ...context,
    })

    throw error
  }
}

/**
 * Wrap external calls with both logging and retries
 */
export async function loggedCallWithRetry<T>(
  serviceName: string,
  fn: () => Promise<T>,
  maxRetries = 3,
  context: LoggedCallContext = {}
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await loggedCall(serviceName, fn, {
        ...context,
        attempt: attempt + 1,
      })
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 30_000)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError
}
