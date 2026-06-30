import { FastifyInstance } from 'fastify'
import { CommunityService } from './community.service.js'
import { CreateCommunityPostSchema, UpdateCommunityPostSchema } from './community.schema.js'

export async function communityRoutes(fastify: FastifyInstance) {
  const service = new CommunityService(fastify.prisma)

  fastify.get('/community/posts', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Community'],
      summary: 'List community posts',
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['all', 'QUESTION', 'ALERT', 'TIP', 'SALE'] },
          limit: { type: 'number', default: 20 },
          offset: { type: 'number', default: 0 },
        },
      },
    },
  }, async (request, reply) => {
    const { category, limit = 20, offset = 0 } = request.query as {
      category?: string; limit: number; offset: number
    }
    const result = await service.listPosts(category, limit, offset)
    return reply.send(result)
  })

  fastify.post('/community/posts', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Community'], summary: 'Create community post' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const body = CreateCommunityPostSchema.parse(request.body)
    const result = await service.createPost(userId, body)
    return reply.status(201).send(result)
  })

  fastify.get<{ Params: { id: string } }>('/community/posts/:id', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Community'], summary: 'Get community post' },
  }, async (request, reply) => {
    const result = await service.getPost(request.params.id)
    return reply.send(result)
  })

  fastify.put<{ Params: { id: string } }>('/community/posts/:id', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Community'], summary: 'Update community post' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const body = UpdateCommunityPostSchema.parse(request.body)
    const result = await service.updatePost(request.params.id, userId, body)
    return reply.send(result)
  })

  fastify.delete<{ Params: { id: string } }>('/community/posts/:id', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Community'], summary: 'Delete community post' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    await service.deletePost(request.params.id, userId)
    return reply.status(204).send()
  })

  fastify.post<{ Params: { id: string } }>('/community/posts/:id/like', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Community'], summary: 'Like a post' },
  }, async (request, reply) => {
    const result = await service.likePost(request.params.id)
    return reply.send(result)
  })

  fastify.delete<{ Params: { id: string } }>('/community/posts/:id/like', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['Community'], summary: 'Unlike a post' },
  }, async (request, reply) => {
    const result = await service.unlikePost(request.params.id)
    return reply.send(result)
  })
}
