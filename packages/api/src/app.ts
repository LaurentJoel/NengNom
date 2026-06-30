import Fastify, { FastifyInstance } from 'fastify'
import { createLogger } from './lib/logger.js'
import { registerRoutes } from './routes.js'

import prismaPlugin from './plugins/prisma.js'
import redisPlugin from './plugins/redis.js'
import authPlugin from './plugins/auth.js'
import corsPlugin from './plugins/cors.js'
import rateLimitPlugin from './plugins/rate-limit.js'
import requestContextPlugin from './plugins/request-context.js'
import idempotencyPlugin from './plugins/idempotency.js'
import multipartPlugin from './plugins/multipart.js'
import swaggerPlugin from './plugins/swagger.js'
import errorHandlerPlugin from './plugins/error-handler.js'

const log = createLogger('app')

export async function createApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false,
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    bodyLimit: 1048576,
    trustProxy: true,
  })

  log.info('Registering core plugins...')

  await fastify.register(prismaPlugin)
  await fastify.register(redisPlugin)
  await fastify.register(authPlugin)
  await fastify.register(corsPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(requestContextPlugin)
  await fastify.register(idempotencyPlugin)
  await fastify.register(multipartPlugin)
  await fastify.register(swaggerPlugin)
  await fastify.register(errorHandlerPlugin)

  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    })
  })

  fastify.get('/health/ready', async (_request, reply) => {
    try {
      await (fastify as any).prisma.$queryRaw`SELECT 1`
      await (fastify as any).redis.ping()
      return reply.send({ status: 'ready' })
    } catch {
      return reply.status(503).send({ status: 'not_ready' })
    }
  })

  fastify.get('/health/live', async (_request, reply) => {
    return reply.send({ status: 'alive' })
  })

  log.info('Registering module routes...')
  await registerRoutes(fastify)

  log.info('✅ Fastify app initialized successfully')
  return fastify
}
