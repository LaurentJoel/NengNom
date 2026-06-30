import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { createLogger } from '../lib/logger.js'

const log = createLogger('idempotency')

/**
 * Idempotency middleware
 * Prevents duplicate operations using Idempotency-Key header
 * Stores responses in Redis with key lifetime
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', async (request, reply) => {
    // Only apply to mutation methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return
    }

    const idempotencyKey = request.headers['idempotency-key'] as string
    if (!idempotencyKey) {
      // Idempotency is optional; not required
      return
    }

    // Check if we've seen this key before
    const cacheKey = `idempotency:${idempotencyKey}`
    const cachedResponse = await fastify.redis.get(cacheKey)

    if (cachedResponse) {
      log.debug('Returning cached idempotent response', { idempotencyKey })
      const cached = JSON.parse(cachedResponse)
      reply.status(cached.statusCode).send(cached.body)
      return
    }

    // Store original reply.send to intercept response
    const originalSend = reply.send
    reply.send = function (payload: any) {
      // Cache successful responses (2xx)
      if (reply.statusCode >= 200 && reply.statusCode < 300) {
        const cacheData = {
          statusCode: reply.statusCode,
          body: payload,
        }
        // Store for 24 hours
        fastify.redis.setex(cacheKey, 86400, JSON.stringify(cacheData))
        log.debug('Cached idempotent response', { idempotencyKey })
      }

      return originalSend.call(this, payload)
    }
  })
})
