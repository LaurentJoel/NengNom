import { FastifyInstance } from 'fastify'
import { AuthService } from './auth.service.js'
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from './auth.schema.js'
import { config } from '../../config/env.js'

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(
    fastify.prisma,
    fastify.redis,
    config,
    (payload, opts) => fastify.jwt.sign(payload as object, opts as any)
  )

  fastify.post('/auth/register', {
    schema: { tags: ['Auth'], summary: 'Register new account' },
  }, async (request, reply) => {
    const body = RegisterSchema.parse(request.body)
    const result = await authService.register(body)
    return reply.status(201).send(result)
  })

  fastify.post('/auth/login', {
    schema: { tags: ['Auth'], summary: 'Login' },
  }, async (request, reply) => {
    const body = LoginSchema.parse(request.body)
    const result = await authService.login(body)
    return reply.status(200).send(result)
  })

  fastify.post('/auth/refresh', {
    schema: { tags: ['Auth'], summary: 'Refresh token' },
  }, async (request, reply) => {
    const body = RefreshTokenSchema.parse(request.body)
    const result = await authService.refreshToken(body.refreshToken)
    return reply.status(200).send(result)
  })

  fastify.post('/auth/logout', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Auth'], summary: 'Logout' },
  }, async (request, reply) => {
    await authService.logout((request.user as any).id)
    return reply.status(204).send()
  })
}
