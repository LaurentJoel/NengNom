import { FastifyInstance } from 'fastify'
import { UsersService } from './users.service.js'
import {
  UpdateProfileSchema,
  UpdateFarmerProfileSchema,
  UpdateVetProfileSchema,
} from './users.schema.js'

export async function usersRoutes(fastify: FastifyInstance) {
  const usersService = new UsersService(fastify.prisma)

  /**
   * GET /users/me
   * Get current authenticated user
   */
  fastify.get('/users/me', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Users'], summary: 'Get current user' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const user = await usersService.getUser(userId)
    return reply.send(user)
  })

  /**
   * GET /users/vets
   * List available vets for consultations
   */
  fastify.get('/users/vets', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'List available veterinarians',
      querystring: {
        type: 'object',
        properties: {
          available: { type: 'boolean' },
          limit: { type: 'number', default: 20 },
        },
      },
    },
  }, async (request, reply) => {
    const { available, limit } = request.query as { available?: boolean; limit?: number }
    const vets = await fastify.prisma.vetProfile.findMany({
      where: available ? { isAvailable: true } : undefined,
      include: { user: true },
      take: limit || 20,
    })
    return reply.send(vets)
  })

  /**
   * GET /users/:id
   * Get user profile by ID
   */
  fastify.get<{ Params: { id: string } }>('/users/:id', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Users'], summary: 'Get user profile' },
  }, async (request, reply) => {
    const user = await usersService.getUser(request.params.id)
    return reply.send(user)
  })

  /**
   * PUT /users/profile
   * Update current user profile
   */
  fastify.put('/users/profile', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Users'], summary: 'Update user profile' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const parsed = UpdateProfileSchema.parse(request.body)
    const result = await usersService.updateProfile(userId, parsed)
    return reply.send(result)
  })

  /**
   * PUT /users/farmer-profile
   * Update farmer profile
   */
  fastify.put('/users/farmer-profile', {
    preHandler: [fastify.authorize('FARMER')],
    schema: { tags: ['Users'], summary: 'Update farmer profile' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const parsed = UpdateFarmerProfileSchema.parse(request.body)
    const result = await usersService.updateFarmerProfile(userId, parsed)
    return reply.send(result)
  })

  /**
   * PUT /users/vet-profile
   * Update vet profile
   */
  fastify.put('/users/vet-profile', {
    preHandler: [fastify.authorize('VET')],
    schema: { tags: ['Users'], summary: 'Update vet profile' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const parsed = UpdateVetProfileSchema.parse(request.body)
    const result = await usersService.updateVetProfile(userId, parsed)
    return reply.send(result)
  })

  /**
   * GET /users/search
   * Search users
   */
  fastify.get('/users/search', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Users'],
      summary: 'Search users',
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          role: { type: 'string' },
        },
        required: ['q'],
      },
    },
  }, async (request, reply) => {
    const { q, role } = request.query as { q: string; role?: string }
    const results = await usersService.searchUsers(q, role)
    return reply.send(results)
  })
}
