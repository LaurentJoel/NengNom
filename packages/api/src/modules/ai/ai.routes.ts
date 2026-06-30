import { FastifyInstance } from 'fastify'
import { AIService } from './ai.service.js'

export async function aiRoutes(fastify: FastifyInstance) {
  const aiService = new AIService(fastify.prisma)

  fastify.get('/ai/suggestions', {
    preHandler: [fastify.authorize('FARMER')],
    schema: { tags: ['AI'], summary: 'Get AI suggestions history' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const suggestions = await aiService.listSuggestions(userId)
    return reply.send(suggestions)
  })

  fastify.get('/ai/suggestions/latest', {
    preHandler: [fastify.authorize('FARMER')],
    schema: { tags: ['AI'], summary: 'Get latest AI suggestion' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const suggestion = await aiService.getLastSuggestion(userId)
    return reply.send(suggestion)
  })

  fastify.post('/ai/suggestions/generate', {
    preHandler: [fastify.authorize('FARMER')],
    schema: { tags: ['AI'], summary: 'Generate new AI suggestions' },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const suggestion = await aiService.generateSuggestions(userId)
    return reply.status(201).send(suggestion)
  })

  fastify.post<{ Params: { id: string } }>('/ai/suggestions/:id/feedback', {
    preHandler: [fastify.authorize('FARMER')],
    schema: {
      tags: ['AI'],
      summary: 'Rate AI suggestion',
      body: { type: 'object', properties: { helpful: { type: 'boolean' } }, required: ['helpful'] },
    },
  }, async (request, reply) => {
    const userId = (request.user as any).id
    const result = await aiService.rateSuggestion(request.params.id, (request.body as any).helpful, userId)
    return reply.send(result)
  })
}
