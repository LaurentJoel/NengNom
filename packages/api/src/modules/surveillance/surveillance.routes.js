import { SurveillanceService } from './surveillance.service.js';
import { CreateDiseaseAlertSchema, UpdateDiseaseAlertSchema, } from './surveillance.schema.js';
/**
 * Disease Surveillance routes
 */
export async function surveillanceRoutes(fastify) {
    const service = new SurveillanceService(fastify.prisma);
    /**
     * POST /surveillance/disease-alerts
     * Create disease alert
     */
    fastify.post('/surveillance/disease-alerts', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Disease Surveillance'],
            summary: 'Report disease alert',
            body: CreateDiseaseAlertSchema,
        },
    }, async (request, reply) => {
        const reportedById = request.user.id;
        const result = await service.createAlert(reportedById, request.body);
        return reply.status(201).send(result);
    });
    /**
     * GET /surveillance/disease-alerts/:id
     * Get disease alert
     */
    fastify.get('/surveillance/disease-alerts/:id', {
        schema: {
            tags: ['Disease Surveillance'],
            summary: 'Get disease alert',
        },
    }, async (request, reply) => {
        const result = await service.getAlert(request.params.id);
        return reply.send(result);
    });
    /**
     * GET /surveillance/disease-alerts
     * List all disease alerts
     */
    fastify.get('/surveillance/disease-alerts', {
        schema: {
            tags: ['Disease Surveillance'],
            summary: 'List disease alerts',
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
        const result = await service.listAlerts(limit, offset);
        return reply.send(result);
    });
    /**
     * GET /surveillance/disease-alerts/by-region/:country/:region
     * Get alerts by region
     */
    fastify.get('/surveillance/disease-alerts/by-region/:country/:region', {
        schema: {
            tags: ['Disease Surveillance'],
            summary: 'Get disease alerts by region',
        },
    }, async (request, reply) => {
        const alerts = await service.listAlertsByRegion(request.params.country, request.params.region);
        return reply.send(alerts);
    });
    /**
     * GET /surveillance/disease-alerts/by-country/:country
     * Get alerts by country
     */
    fastify.get('/surveillance/disease-alerts/by-country/:country', {
        schema: {
            tags: ['Disease Surveillance'],
            summary: 'Get disease alerts by country',
        },
    }, async (request, reply) => {
        const alerts = await service.listAlertsByCountry(request.params.country);
        return reply.send(alerts);
    });
    /**
     * GET /surveillance/disease-alerts/high-severity/:country
     * Get high-severity alerts for country
     */
    fastify.get('/surveillance/disease-alerts/high-severity/:country', {
        schema: {
            tags: ['Disease Surveillance'],
            summary: 'Get high-severity disease alerts',
        },
    }, async (request, reply) => {
        const alerts = await service.getHighSeverityAlerts(request.params.country);
        return reply.send(alerts);
    });
    /**
     * PATCH /surveillance/disease-alerts/:id
     * Update disease alert
     */
    fastify.patch('/surveillance/disease-alerts/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Disease Surveillance'],
            summary: 'Update disease alert',
            body: UpdateDiseaseAlertSchema,
        },
    }, async (request, reply) => {
        const result = await service.updateAlert(request.params.id, request.body);
        return reply.send(result);
    });
    /**
     * GET /surveillance/disease-summary/:country
     * Get disease summary for country
     */
    fastify.get('/surveillance/disease-summary/:country', {
        schema: {
            tags: ['Disease Surveillance'],
            summary: 'Get disease summary for country',
        },
    }, async (request, reply) => {
        const summary = await service.getDiseaseSummary(request.params.country);
        return reply.send(summary);
    });
}
//# sourceMappingURL=surveillance.routes.js.map