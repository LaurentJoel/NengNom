import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import { config } from '../config/env.js'

/**
 * CORS plugin configuration
 * Allows requests from configured origins only
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyCors, {
    origin: config.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-ID'],
  })
})
