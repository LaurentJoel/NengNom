import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { getRedisClient } from '../lib/redis.js'
import type Redis from 'ioredis'

/**
 * Fastify plugin to inject Redis client as a singleton
 * Accessed via fastify.redis throughout the app
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
  const redis = getRedisClient()

  fastify.decorate('redis', redis)

  fastify.addHook('onClose', async () => {
    await redis.quit()
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}
