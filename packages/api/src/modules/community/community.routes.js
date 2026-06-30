import { CommunityService } from './community.service.js';
import { CreateCommunityPostSchema, UpdateCommunityPostSchema, } from './community.schema.js';
/**
 * Community routes
 */
export async function communityRoutes(fastify) {
    const service = new CommunityService(fastify.prisma);
    /**
     * POST /community/posts
     * Create community post
     */
    fastify.post('/community/posts', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Community'],
            summary: 'Create community post',
            body: CreateCommunityPostSchema,
        },
    }, async (request, reply) => {
        const authorId = request.user.id;
        const result = await service.createPost(authorId, request.body);
        return reply.status(201).send(result);
    });
    /**
     * GET /community/posts/:id
     * Get community post
     */
    fastify.get('/community/posts/:id', {
        schema: {
            tags: ['Community'],
            summary: 'Get community post',
        },
    }, async (request, reply) => {
        const result = await service.getPost(request.params.id);
        return reply.send(result);
    });
    /**
     * GET /community/posts
     * List community posts
     */
    fastify.get('/community/posts', {
        schema: {
            tags: ['Community'],
            summary: 'List community posts',
            querystring: {
                type: 'object',
                properties: {
                    category: { type: 'string', enum: ['QUESTION', 'ALERT', 'TIP', 'SALE'] },
                    tags: { type: 'string' },
                    limit: { type: 'number', default: 20 },
                    offset: { type: 'number', default: 0 },
                },
            },
        },
    }, async (request, reply) => {
        const { category, tags: tagsStr, limit, offset } = request.query;
        const tags = tagsStr ? tagsStr.split(',') : undefined;
        const result = await service.listPosts(category, tags, limit, offset);
        return reply.send(result);
    });
    /**
     * GET /community/posts/search
     * Search community posts
     */
    fastify.get('/community/posts/search', {
        schema: {
            tags: ['Community'],
            summary: 'Search community posts',
            querystring: {
                type: 'object',
                properties: {
                    q: { type: 'string' },
                    limit: { type: 'number', default: 20 },
                    offset: { type: 'number', default: 0 },
                },
                required: ['q'],
            },
        },
    }, async (request, reply) => {
        const { q, limit, offset } = request.query;
        const result = await service.searchPosts(q, limit, offset);
        return reply.send(result);
    });
    /**
     * PATCH /community/posts/:id
     * Update community post
     */
    fastify.patch('/community/posts/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Community'],
            summary: 'Update community post',
            body: UpdateCommunityPostSchema,
        },
    }, async (request, reply) => {
        const authorId = request.user.id;
        const result = await service.updatePost(request.params.id, authorId, request.body);
        return reply.send(result);
    });
    /**
     * DELETE /community/posts/:id
     * Delete community post
     */
    fastify.delete('/community/posts/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Community'],
            summary: 'Delete community post',
        },
    }, async (request, reply) => {
        const authorId = request.user.id;
        await service.deletePost(request.params.id, authorId);
        return reply.status(204).send();
    });
    /**
     * POST /community/posts/:id/like
     * Like post
     */
    fastify.post('/community/posts/:id/like', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Community'],
            summary: 'Like post',
        },
    }, async (request, reply) => {
        const result = await service.likePost(request.params.id);
        return reply.send(result);
    });
    /**
     * DELETE /community/posts/:id/like
     * Unlike post
     */
    fastify.delete('/community/posts/:id/like', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Community'],
            summary: 'Unlike post',
        },
    }, async (request, reply) => {
        const result = await service.unlikePost(request.params.id);
        return reply.send(result);
    });
    /**
     * GET /community/trending
     * Get trending topics
     */
    fastify.get('/community/trending', {
        schema: {
            tags: ['Community'],
            summary: 'Get trending topics',
            querystring: {
                type: 'object',
                properties: {
                    days: { type: 'number', default: 7 },
                    limit: { type: 'number', default: 10 },
                },
            },
        },
    }, async (request, reply) => {
        const { days, limit } = request.query;
        const trending = await service.getTrendingTopics(days, limit);
        return reply.send(trending);
    });
}
//# sourceMappingURL=community.routes.js.map