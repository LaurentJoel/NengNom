import { LabRequestsService } from './lab-requests.service.js';
import { CreateLabRequestSchema, UpdateLabRequestSchema, } from './lab-requests.schema.js';
/**
 * Lab Requests routes
 */
export async function labRequestsRoutes(fastify) {
    const service = new LabRequestsService(fastify.prisma);
    /**
     * POST /lab-requests
     * Create lab test request
     */
    fastify.post('/lab-requests', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Lab Requests'],
            summary: 'Request mobile lab test',
            body: CreateLabRequestSchema,
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const result = await service.createRequest(farmerId, request.body);
        return reply.status(201).send(result);
    });
    /**
     * GET /lab-requests/:id
     * Get lab request
     */
    fastify.get('/lab-requests/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Lab Requests'],
            summary: 'Get lab request details',
        },
    }, async (request, reply) => {
        const result = await service.getRequest(request.params.id);
        return reply.send(result);
    });
    /**
     * GET /lab-requests
     * List lab requests
     */
    fastify.get('/lab-requests', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Lab Requests'],
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
        const { limit, offset } = request.query;
        const user = request.user;
        // Farmers see their requests, vets/admins see all
        let result;
        if (user.role === 'FARMER') {
            result = await service.listRequests(user.id, limit, offset);
        }
        else {
            result = await service.listRequestsByStatus('REQUESTED', limit, offset);
        }
        return reply.send(result);
    });
    /**
     * PATCH /lab-requests/:id
     * Update lab request
     */
    fastify.patch('/lab-requests/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Lab Requests'],
            summary: 'Update lab request status/results',
            body: UpdateLabRequestSchema,
        },
    }, async (request, reply) => {
        const result = await service.updateRequest(request.params.id, request.body);
        return reply.send(result);
    });
    /**
     * GET /lab-requests/pending
     * List pending lab requests (for lab technicians)
     */
    fastify.get('/lab-requests/pending', {
        preHandler: [fastify.authorize('LAB_TECH', 'VET', 'ADMIN')],
        schema: {
            tags: ['Lab Requests'],
            summary: 'List pending lab requests',
        },
    }, async (request, reply) => {
        const requests = await service.listPendingRequests();
        return reply.send(requests);
    });
    /**
     * POST /lab-requests/:id/vet-review
     * Add vet review to lab results
     */
    fastify.post('/lab-requests/:id/vet-review', {
        preHandler: [fastify.authorize('VET')],
        schema: {
            tags: ['Lab Requests'],
            summary: 'Add vet review to lab results',
            body: {
                type: 'object',
                properties: { review: { type: 'string' } },
                required: ['review'],
            },
        },
    }, async (request, reply) => {
        const vetId = request.user.id;
        const result = await service.assignVetReview(request.params.id, vetId, request.body.review);
        return reply.send(result);
    });
}
//# sourceMappingURL=lab-requests.routes.js.map