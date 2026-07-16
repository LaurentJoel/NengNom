import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { createHash } from 'crypto'
import { createLogger } from '../lib/logger.js'
import { REDIS } from '../config/constants.js'

const log = createLogger('idempotency')

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  fastify.addHook('preHandler', async (request, reply) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return

    const idempotencyKey = request.headers['idempotency-key'] as string
    if (!idempotencyKey) return

    // Scope key to the requesting user by hashing their auth header — prevents cross-user cache poisoning
    const rawAuth = request.headers['authorization'] ?? 'anon'
    const userScope = createHash('sha256').update(rawAuth as string).digest('hex').slice(0, 16)
    const cacheKey = `idempotency:${userScope}:${idempotencyKey}`

    // Atomic claim — SET NX prevents TOCTOU race where two concurrent requests both see a missing key
    const claimed = await fastify.redis.set(cacheKey, 'in-flight', 'EX', REDIS.IDEMPOTENCY_TTL, 'NX')

    if (!claimed) {
      // Key already exists — either a completed result or a concurrent in-flight request
      const value = await fastify.redis.get(cacheKey)
      if (value && value !== 'in-flight') {
        log.info('Returning cached idempotent response', { idempotencyKey })
        const cached = JSON.parse(value)
        reply.status(cached.statusCode).send(cached.body)
        return
      }
      // Concurrent duplicate in flight — return 409
      reply.status(409).send({
        success: false,
        error: { code: 'CONFLICT', message: 'A request with this idempotency key is already being processed' },
      })
      return
    }

    // Intercept the response to cache it after execution
    const originalSend = reply.send.bind(reply)
    reply.send = function (payload: any) {
      if (reply.statusCode >= 200 && reply.statusCode < 300) {
        fastify.redis.setex(cacheKey, REDIS.IDEMPOTENCY_TTL, JSON.stringify({ statusCode: reply.statusCode, body: payload }))
        log.info('Cached idempotent response', { idempotencyKey })
      } else {
        // Release the lock on error so the client can retry
        fastify.redis.del(cacheKey)
      }
      return originalSend(payload)
    }
  })
})
