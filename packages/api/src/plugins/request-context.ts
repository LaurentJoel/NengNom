import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '../lib/logger.js'

const log = createLogger('request-context')

/**
 * Request context plugin
 * Adds request ID and timing to every request
 * Useful for tracing and performance monitoring
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const requestId = request.headers['x-request-id'] || uuidv4()
    request.id = requestId as string
    ;(request as any).startTime = Date.now()
    reply.header('X-Request-ID', requestId)

    log.debug('Request received', {
      requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
    })
  })

  fastify.addHook('onSend', async (request, reply) => {
    const duration = Date.now() - ((request as any).startTime || Date.now())
    reply.header('X-Process-Time', `${duration}ms`)
  })

  fastify.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - ((request as any).startTime || Date.now())
    log.debug('Request completed', {
      requestId: request.id,
      method: request.method,
      statusCode: reply.statusCode,
      durationMs: duration,
    })
  })
})
