import { FastifyInstance } from 'fastify'
import { LabRequestsService } from './lab-requests.service.js'
import { CreateLabRequestSchema, UpdateLabRequestSchema } from './lab-requests.schema.js'

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
    const result = await service.getRequest(request.params.id)
    return reply.send(result)
  })

  fastify.patch<{ Params: { id: string } }>('/lab-requests/:id', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Lab'], summary: 'Update lab request status' },
  }, async (request, reply) => {
    const body = UpdateLabRequestSchema.parse(request.body)
    const result = await service.updateRequest(request.params.id, body)
    return reply.send(result)
  })
}
