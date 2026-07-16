import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { v4 as uuidv4 } from 'uuid'
import { createLogger } from '../lib/logger.js'

const log = createLogger('request-context')

// Allowlist pattern prevents log injection via X-Request-ID header
const REQUEST_ID_RE = /^[a-zA-Z0-9_\-]{1,64}$/

const SLOW_REQUEST_MS = 2000

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const rawId = request.headers['x-request-id'] as string | undefined
    const requestId = rawId && REQUEST_ID_RE.test(rawId) ? rawId : uuidv4()
    request.id = requestId
    ;(request as any).startTime = Date.now()
    reply.header('X-Request-ID', requestId)

    log.info('→ request', {
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
    const userId = (request.user as any)?.id
    const isSlow = duration > SLOW_REQUEST_MS

    const entry = {
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs: duration,
      userId,
      ...(isSlow && { slowRequest: true }),
    }

    if (isSlow) {
      log.warn('← slow response', entry)
    } else {
      log.info('← response', entry)
    }
  })
})
