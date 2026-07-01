import { FastifyInstance } from 'fastify'
import { AdminService } from './admin.service.js'
import { z } from 'zod'

const CreateAlertSchema = z.object({
  diseaseName: z.string().min(2).max(100),
  region: z.string().min(1).max(100),
  country: z.string().length(2),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  isConfirmed: z.boolean().default(false),
})

export async function adminRoutes(fastify: FastifyInstance) {
  const service = new AdminService(fastify.prisma)

  // All admin routes require ADMIN role
  const adminAuth = { preHandler: [fastify.authorize('ADMIN')] }

  /**
   * GET /admin/stats
   * Platform-wide overview statistics
   */
  fastify.get('/admin/stats', {
    ...adminAuth,
    schema: { tags: ['Admin'], summary: 'Platform statistics' },
  }, async (request, reply) => {
    const stats = await service.getPlatformStats()
    return reply.send(stats)
  })

  /**
   * GET /admin/users
   * List all users with optional role/search filter
   */
  fastify.get('/admin/users', {
    ...adminAuth,
    schema: {
      tags: ['Admin'],
      summary: 'List all users',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
          role: { type: 'string' },
          q: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { page, limit, role, q } = request.query as any
    const result = await service.listUsers(page, limit, role, q)
    return reply.send(result)
  })

  /**
   * PATCH /admin/users/:id/status
   * Activate or deactivate a user account
   */
  fastify.patch<{ Params: { id: string } }>('/admin/users/:id/status', {
    ...adminAuth,
    schema: { tags: ['Admin'], summary: 'Toggle user active status' },
  }, async (request, reply) => {
    const { isActive } = request.body as { isActive: boolean }
    const result = await service.toggleUserStatus(request.params.id, isActive)
    return reply.send(result)
  })

  /**
   * GET /admin/consultations
   * List all consultations across the platform
   */
  fastify.get('/admin/consultations', {
    ...adminAuth,
    schema: {
      tags: ['Admin'],
      summary: 'List all consultations',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
          status: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { page, limit, status } = request.query as any
    const result = await service.listAllConsultations(page, limit, status)
    return reply.send(result)
  })

  /**
   * GET /admin/alerts
   * List all disease alerts
   */
  fastify.get('/admin/alerts', {
    ...adminAuth,
    schema: { tags: ['Admin'], summary: 'List disease alerts' },
  }, async (_request, reply) => {
    const alerts = await service.listAlerts()
    return reply.send(alerts)
  })

  /**
   * POST /admin/alerts
   * Create a disease alert
   */
  fastify.post('/admin/alerts', {
    ...adminAuth,
    schema: { tags: ['Admin'], summary: 'Create disease alert' },
  }, async (request, reply) => {
    const adminId = (request.user as any).id
    const body = CreateAlertSchema.parse(request.body) as {
      diseaseName: string; region: string; country: string; severity: string; isConfirmed: boolean
    }
    const alert = await service.createAlert({ ...body, reportedById: adminId })
    return reply.status(201).send(alert)
  })

  /**
   * DELETE /admin/alerts/:id
   * Delete a disease alert
   */
  fastify.delete<{ Params: { id: string } }>('/admin/alerts/:id', {
    ...adminAuth,
    schema: { tags: ['Admin'], summary: 'Delete disease alert' },
  }, async (request, reply) => {
    await service.deleteAlert(request.params.id)
    return reply.status(204).send()
  })

  /**
   * DELETE /admin/community/posts/:id
   * Moderate: remove a community post
   */
  fastify.delete<{ Params: { id: string } }>('/admin/community/posts/:id', {
    ...adminAuth,
    schema: { tags: ['Admin'], summary: 'Delete community post (moderation)' },
  }, async (request, reply) => {
    await service.deleteCommunityPost(request.params.id)
    return reply.status(204).send()
  })
}
