import { FarmRecordsService } from './farm-records.service.js';
import { CreateFarmRecordSchema, UpdateFarmRecordSchema, } from './farm-records.schema.js';
/**
 * Farm Records routes
 */
export async function farmRecordsRoutes(fastify) {
    const service = new FarmRecordsService(fastify.prisma);
    /**
     * POST /farm-records
     * Create farm record
     */
    fastify.post('/farm-records', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Farm Records'],
            summary: 'Create farm production record',
            body: CreateFarmRecordSchema,
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        // TODO: Get farmer profile ID from relationship
        const result = await service.createRecord(userId, request.body);
        return reply.status(201).send(result);
    });
    /**
     * GET /farm-records/:id
     * Get farm record
     */
    fastify.get('/farm-records/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Farm Records'],
            summary: 'Get farm record',
        },
    }, async (request, reply) => {
        const result = await service.getRecord(request.params.id);
        return reply.send(result);
    });
    /**
     * GET /farm-records
     * List farm records
     */
    fastify.get('/farm-records', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Farm Records'],
            summary: 'List farm records',
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'number', default: 30 },
                    offset: { type: 'number', default: 0 },
                },
            },
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const { limit, offset } = request.query;
        const result = await service.listRecords(farmerId, limit, offset);
        return reply.send(result);
    });
    /**
     * PATCH /farm-records/:id
     * Update farm record
     */
    fastify.patch('/farm-records/:id', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Farm Records'],
            summary: 'Update farm record',
            body: UpdateFarmRecordSchema,
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const result = await service.updateRecord(request.params.id, farmerId, request.body);
        return reply.send(result);
    });
    /**
     * DELETE /farm-records/:id
     * Delete farm record
     */
    fastify.delete('/farm-records/:id', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Farm Records'],
            summary: 'Delete farm record',
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        await service.deleteRecord(request.params.id, farmerId);
        return reply.status(204).send();
    });
    /**
     * GET /farm-records/stats/:year/:month
     * Get monthly statistics
     */
    fastify.get('/farm-records/stats/:year/:month', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Farm Records'],
            summary: 'Get monthly farm statistics',
        },
    }, async (request, reply) => {
        const farmerId = request.user.id;
        const year = parseInt(request.params.year);
        const month = parseInt(request.params.month);
        const stats = await service.getMonthlyStats(farmerId, year, month);
        return reply.send(stats);
    });
}
//# sourceMappingURL=farm-records.routes.js.map