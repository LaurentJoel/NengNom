import { FastifyInstance } from 'fastify'
import { HealthEventsService } from './health-events.service.js'
import {
  CreateHealthEventSchema,
  UpdateHealthEventSchema,
} from './health-events.schema.js'

/**
 * Health Events routes
 */
export async function healthEventsRoutes(fastify: FastifyInstance) {
  const service = new HealthEventsService(fastify.prisma)

  /**
   * POST /health-events
   * Create health event (vaccination, deworming, etc.)
   */
  fastify.post(
    '/health-events',
    {
      preHandler: [fastify.authorize('FARMER')],
      schema: { tags: ['Health Events'], summary: 'Create health event (vaccination/deworming)' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const body = CreateHealthEventSchema.parse(request.body)
      const result = await service.createEvent(userId, body)
      return reply.status(201).send(result)
    }
  )

  /**
   * GET /health-events/:id
   * Get health event
   */
  fastify.get<{ Params: { id: string } }>(
    '/health-events/:id',
    {
      preHandler: [fastify.authenticate],
      schema: { tags: ['Health Events'], summary: 'Get health event details' },
    },
    async (request, reply) => {
      const result = await service.getEvent(request.params.id)
      return reply.send(result)
    }
  )

  /**
   * GET /health-events/reminders
   * Get upcoming vaccination/deworming reminders
   */
  fastify.get(
    '/health-events/reminders',
    {
      preHandler: [fastify.authorize('FARMER')],
      schema: { tags: ['Health Events'], summary: 'Get upcoming health event reminders' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const reminders = await service.getUpcomingDeadlines(userId)
      return reply.send(reminders)
    }
  )

  /**
   * GET /health-events
   * List health events
   */
  fastify.get(
    '/health-events',
    {
      preHandler: [fastify.authorize('FARMER')],
      schema: {
        tags: ['Health Events'],
        summary: 'List health events',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const { limit, offset } = request.query as { limit: number; offset: number }
      const result = await service.listEvents(userId, limit, offset)
      return reply.send(result)
    }
  )

  /**
   * PATCH /health-events/:id
   * Update health event
   */
  fastify.patch<{ Params: { id: string } }>(
    '/health-events/:id',
    {
      preHandler: [fastify.authorize('FARMER')],
      schema: { tags: ['Health Events'], summary: 'Update health event' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const body = UpdateHealthEventSchema.parse(request.body)
      const result = await service.updateEvent(request.params.id, userId, body)
      return reply.send(result)
    }
  )

  /**
   * DELETE /health-events/:id
   * Delete health event
   */
  fastify.delete<{ Params: { id: string } }>(
    '/health-events/:id',
    {
      preHandler: [fastify.authorize('FARMER')],
      schema: { tags: ['Health Events'], summary: 'Delete health event' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      await service.deleteEvent(request.params.id, userId)
      return reply.status(204).send()
    }
  )
}
