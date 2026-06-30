import { ConsultationsService } from './consultations.service.js';
import { CreateConsultationSchema, UpdateConsultationSchema, CreateMessageSchema, } from './consultations.schema.js';
/**
 * Consultations routes
 */
export async function consultationsRoutes(fastify) {
    const service = new ConsultationsService(fastify.prisma);
    /**
     * POST /consultations
     * Create a consultation
     */
    fastify.post('/consultations', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Consultations'],
            summary: 'Create consultation with vet',
            body: CreateConsultationSchema,
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        // TODO: Get farmer profile ID from relationship
        const result = await service.createConsultation(farmerId, request.body);
        return reply.status(201).send(result);
    });
    /**
     * GET /consultations/:id
     * Get consultation by ID
     */
    fastify.get('/consultations/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Consultations'],
            summary: 'Get consultation details',
        },
    }, async (request, reply) => {
        const result = await service.getConsultation(request.params.id);
        return reply.send(result);
    });
    /**
     * GET /consultations
     * List consultations
     */
    fastify.get('/consultations', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Consultations'],
            summary: 'List consultations',
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'number', default: 20 },
                    offset: { type: 'number', default: 0 },
                },
            },
        },
    }, async (request, reply) => {
        const user = request.user;
        const { limit, offset } = request.query;
        let result;
        if (user.role === 'FARMER') {
            result = await service.listConsultations(user.id, limit, offset);
        }
        else if (user.role === 'VET') {
            result = await service.listVetConsultations(user.id, limit, offset);
        }
        return reply.send(result);
    });
    /**
     * PATCH /consultations/:id
     * Update consultation
     */
    fastify.patch('/consultations/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Consultations'],
            summary: 'Update consultation',
            body: UpdateConsultationSchema,
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const result = await service.updateConsultation(request.params.id, userId, request.body);
        return reply.send(result);
    });
    /**
     * POST /consultations/:id/messages
     * Send message in consultation
     */
    fastify.post('/consultations/:id/messages', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Consultations'],
            summary: 'Send message in consultation',
            body: CreateMessageSchema,
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const result = await service.addMessage(request.params.id, userId, request.body);
        return reply.status(201).send(result);
    });
    /**
     * GET /consultations/:id/messages
     * Get consultation messages
     */
    fastify.get('/consultations/:id/messages', {
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
    }, async (request, reply) => {
        const { limit, offset } = request.query;
        const result = await service.getMessages(request.params.id, limit, offset);
        return reply.send(result);
    });
}
//# sourceMappingURL=consultations.routes.js.map