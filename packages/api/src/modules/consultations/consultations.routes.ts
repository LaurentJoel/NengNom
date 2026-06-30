import { FastifyInstance } from 'fastify'
import { ConsultationsService } from './consultations.service.js'
import {
  CreateConsultationSchema,
  UpdateConsultationSchema,
  CreateMessageSchema,
} from './consultations.schema.js'

/**
 * Consultations routes
 */
export async function consultationsRoutes(fastify: FastifyInstance) {
  const service = new ConsultationsService(fastify.prisma)

  /**
   * POST /consultations
   * Create a consultation
   */
  fastify.post(
    '/consultations',
    {
      preHandler: [fastify.authorize('FARMER')],
      schema: { tags: ['Consultations'], summary: 'Create consultation with vet' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const body = CreateConsultationSchema.parse(request.body)
      const result = await service.createConsultation(userId, body)
      return reply.status(201).send(result)
    }
  )

  /**
   * GET /consultations/:id
   * Get consultation by ID
   */
  fastify.get<{ Params: { id: string } }>(
    '/consultations/:id',
    {
      preHandler: [fastify.authenticate],
      schema: { tags: ['Consultations'], summary: 'Get consultation details' },
    },
    async (request, reply) => {
      const result = await service.getConsultation(request.params.id)
      return reply.send(result)
    }
  )

  /**
   * GET /consultations
   * List consultations
   */
  fastify.get(
    '/consultations',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Consultations'],
        summary: 'List consultations',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 20 },
            offset: { type: 'number', default: 0 },
            status: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as any
      const { limit, offset } = request.query as { limit: number; offset: number }

      let result
      if (user.role === 'FARMER') {
        result = await service.listConsultations(user.id, limit, offset)
      } else if (user.role === 'VET') {
        result = await service.listVetConsultations(user.id, limit, offset)
      }

      return reply.send(result)
    }
  )

  /**
   * PATCH /consultations/:id
   * Update consultation
   */
  fastify.patch<{ Params: { id: string } }>(
    '/consultations/:id',
    {
      preHandler: [fastify.authenticate],
      schema: { tags: ['Consultations'], summary: 'Update consultation' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const body = UpdateConsultationSchema.parse(request.body)
      const result = await service.updateConsultation(request.params.id, userId, body)
      return reply.send(result)
    }
  )

  /**
   * POST /consultations/:id/messages
   * Send message in consultation
   */
  fastify.post<{ Params: { id: string } }>(
    '/consultations/:id/messages',
    {
      preHandler: [fastify.authenticate],
      schema: { tags: ['Consultations'], summary: 'Send message in consultation' },
    },
    async (request, reply) => {
      const userId = (request.user as any).id
      const body = CreateMessageSchema.parse(request.body)
      const result = await service.addMessage(request.params.id, userId, body)
      return reply.status(201).send(result)
    }
  )

  /**
   * GET /consultations/:id/messages
   * Get consultation messages
   */
  fastify.get<{ Params: { id: string } }>(
    '/consultations/:id/messages',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Consultations'],
        summary: 'Get consultation messages',
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
      const { limit, offset } = request.query as { limit: number; offset: number }
      const result = await service.getMessages(request.params.id, limit, offset)
      return reply.send(result)
    }
  )
}
