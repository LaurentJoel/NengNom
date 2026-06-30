/**
 * Idempotency utilities
 * Helpers for generating and validating Idempotency-Key headers
 */

import { v4 as uuidv4 } from 'uuid'

/**
 * Generate an idempotency key (UUID v4)
 */
export function generateIdempotencyKey(): string {
  return uuidv4()
}

/**
 * Validate idempotency key format (UUID v4)
 */
export function isValidIdempotencyKey(key: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    key
  )
}

/**
 * Extract idempotency key from request headers
 */
export function getIdempotencyKey(
  headers: Record<string, string | string[] | undefined>
): string | null {
  const key = headers['idempotency-key']
  if (!key) return null
  return typeof key === 'string' ? key : key[0]
}
