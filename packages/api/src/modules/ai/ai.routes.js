import { AIService } from './ai.service.js';
/**
 * AI Suggestions routes
 */
export async function aiRoutes(fastify) {
    const aiService = new AIService(fastify.prisma);
    /**
     * GET /ai/suggestions
     * Get latest AI suggestions for farmer
     */
    fastify.get('/ai/suggestions', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['AI'],
            summary: 'Get AI farm suggestions',
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const suggestion = await aiService.getLastSuggestion(farmerId);
        return reply.send(suggestion);
    });
    /**
     * POST /ai/suggestions/generate
     * Generate new suggestions (can be called manually or by scheduled job)
     */
    fastify.post('/ai/suggestions/generate', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['AI'],
            summary: 'Generate new AI suggestions',
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const suggestion = await aiService.generateSuggestions(farmerId);
        return reply.status(201).send(suggestion);
    });
    /**
     * POST /ai/suggestions/:id/feedback
     * Rate suggestion helpfulness
     */
    fastify.post('/ai/suggestions/:id/feedback', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['AI'],
            summary: 'Rate AI suggestion',
            body: {
                type: 'object',
                properties: { helpful: { type: 'boolean' } },
                required: ['helpful'],
            },
        },
    }, async (request, reply) => {
        const helpful = request.body.helpful;
        const result = await aiService.rateSuggestion(request.params.id, helpful);
        return reply.send(result);
    });
}
//# sourceMappingURL=ai.routes.js.map