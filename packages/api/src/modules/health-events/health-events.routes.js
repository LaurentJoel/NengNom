import { HealthEventsService } from './health-events.service.js';
import { CreateHealthEventSchema, UpdateHealthEventSchema, } from './health-events.schema.js';
/**
 * Health Events routes
 */
export async function healthEventsRoutes(fastify) {
    const service = new HealthEventsService(fastify.prisma);
    /**
     * POST /health-events
     * Create health event (vaccination, deworming, etc.)
     */
    fastify.post('/health-events', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Health Events'],
            summary: 'Create health event (vaccination/deworming)',
            body: CreateHealthEventSchema,
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const result = await service.createEvent(farmerId, request.body);
        return reply.status(201).send(result);
    });
    /**
     * GET /health-events/:id
     * Get health event
     */
    fastify.get('/health-events/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Health Events'],
            summary: 'Get health event details',
        },
    }, async (request, reply) => {
        const result = await service.getEvent(request.params.id);
        return reply.send(result);
    });
    /**
     * GET /health-events
     * List health events
     */
    fastify.get('/health-events', {
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
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const { limit, offset } = request.query;
        const result = await service.listEvents(farmerId, limit, offset);
        return reply.send(result);
    });
    /**
     * GET /health-events/reminders
     * Get upcoming vaccination/deworming reminders
     */
    fastify.get('/health-events/reminders', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Health Events'],
            summary: 'Get upcoming health event reminders',
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const reminders = await service.getUpcomingDeadlines(farmerId);
        return reply.send(reminders);
    });
    /**
     * PATCH /health-events/:id
     * Update health event
     */
    fastify.patch('/health-events/:id', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Health Events'],
            summary: 'Update health event',
            body: UpdateHealthEventSchema,
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const result = await service.updateEvent(request.params.id, farmerId, request.body);
        return reply.send(result);
    });
    /**
     * DELETE /health-events/:id
     * Delete health event
     */
    fastify.delete('/health-events/:id', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Health Events'],
            summary: 'Delete health event',
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        await service.deleteEvent(request.params.id, farmerId);
        return reply.status(204).send();
    });
}
//# sourceMappingURL=health-events.routes.js.map