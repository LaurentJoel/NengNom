import Redis from 'ioredis'
import { createLogger } from './logger.js'
import { config } from '../config/env.js'

const log = createLogger('redis')

/**
 * Singleton Redis client instance
 * Reused for caching, sessions, and distributed locks
 */
let redis: Redis

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    redis.on('connect', () => {
      log.info('Redis connected')
    })

    redis.on('error', (error) => {
      log.error('Redis error', { error: error.message })
    })

    redis.on('close', () => {
      log.info('Redis disconnected')
    })
  }

  return redis
}

/**
 * Gracefully disconnect Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
  }
}

export default getRedisClient()
