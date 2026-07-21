import { getRedisClient } from './redis.js'
import { createLogger } from './logger.js'

const log = createLogger('cache')

/**
 * Redis-backed read cache.
 *
 * Every helper is fail-open: if Redis is unreachable or returns garbage we log
 * and fall through to the source of truth. A cache outage must never turn into
 * an API outage.
 *
 * Caveat — cached values round-trip through JSON, so a cache hit returns Date
 * and Prisma Decimal fields as strings while a miss returns the real objects.
 * That is invisible for values which are only serialized into an HTTP response
 * (both paths end up in JSON.stringify). Do NOT cache a value that callers then
 * consume programmatically as a Date/Decimal — cache the computed result instead.
 */

export const CACHE_TTL = {
  FARMER_ID: 3600,      // userId -> farmerProfileId, changes only if the profile is recreated
  SUGGESTIONS: 300,     // AI suggestions are regenerated on demand
  CONSULTATIONS: 30,    // short — busted explicitly on write
  FARM_STATS: 300,
} as const

export const cacheKeys = {
  farmerId: (userId: string) => `cache:farmer_id:${userId}`,
  vetId: (userId: string) => `cache:vet_id:${userId}`,
  latestSuggestion: (farmerId: string) => `cache:ai_latest:${farmerId}`,
  consultationList: (userId: string, limit: number, offset: number) =>
    `cache:consults:${userId}:${limit}:${offset}`,
  farmStats: (farmerId: string, year: number, month: number) =>
    `cache:farm_stats:${farmerId}:${year}:${month}`,
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedisClient().get(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch (err) {
    log.warn('Cache read failed, falling through to source', {
      key,
      errorMessage: err instanceof Error ? err.message : 'unknown',
    })
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await getRedisClient().set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch (err) {
    log.warn('Cache write failed', {
      key,
      errorMessage: err instanceof Error ? err.message : 'unknown',
    })
  }
}

/**
 * Delete specific keys. Never uses KEYS/SCAN — callers pass exact keys so this
 * stays O(1) per key regardless of keyspace size.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    await getRedisClient().del(...keys)
  } catch (err) {
    log.warn('Cache invalidation failed', {
      keys: keys.join(','),
      errorMessage: err instanceof Error ? err.message : 'unknown',
    })
  }
}

/**
 * Read-through cache. Runs `loader` on a miss and stores the result.
 *
 * `null`/`undefined` results are not cached, so a transient miss can't pin a
 * negative result for the whole TTL.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = await cacheGet<T>(key)
  if (hit !== null) return hit

  const fresh = await loader()
  if (fresh !== null && fresh !== undefined) {
    await cacheSet(key, fresh, ttlSeconds)
  }
  return fresh
}
