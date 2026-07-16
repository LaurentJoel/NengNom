import { FastifyInstance } from 'fastify'
import { LabRequestsService } from './lab-requests.service.js'
import { CreateLabRequestSchema, UpdateLabRequestSchema } from './lab-requests.schema.js'
import { ForbiddenError } from '../../lib/errors.js'

export async function labRequestsRoutes(fastify: FastifyInstance) {
  const service = new LabRequestsService(fastify.prisma)

  fastify.post('/lab-requests', {
    preHandler: [fastify.authorize('FARMER')],
    schema: { tags: ['Lab'], summary: 'Create lab test request' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const body = CreateLabRequestSchema.parse(request.body)
    const result = await service.createRequest(userId, body)
    return reply.status(201).send(result)
  })

  fastify.get('/lab-requests', {
    preHandler: [fastify.authorize('FARMER')],
    schema: {
      tags: ['Lab'],
      summary: 'List lab requests',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 20 },
          offset: { type: 'number', default: 0 },
        },
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const { limit, offset } = request.query as { limit: number; offset: number }
    const result = await service.listRequests(userId, limit, offset)
    return reply.send(result)
  })

  fastify.get<{ Params: { id: string } }>('/lab-requests/:id', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Lab'], summary: 'Get lab request' },
  }, async (request, reply) => {
    const user = request.user as any
    const result = await service.getRequest(request.params.id)
    // FARMERs can only view their own; VETs may view any to pick up work
    if (user.role === 'FARMER' && result.farmer?.user?.id !== user.id) {
      throw new ForbiddenError('You do not have access to this lab request')
    }
    return reply.send(result)
  })

  fastify.patch<{ Params: { id: string } }>('/lab-requests/:id', {
    preHandler: [fastify.authorize('VET')],
    schema: { tags: ['Lab'], summary: 'Update lab request status (VET only)' },
  }, async (request, reply) => {
    const body = UpdateLabRequestSchema.parse(request.body)
    const result = await service.updateRequest(request.params.id, body)
    return reply.send(result)
  })
}
