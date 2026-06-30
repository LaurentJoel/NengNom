import Fastify from 'fastify';
import { createLogger } from './lib/logger.js';
import { registerRoutes } from './routes.js';
const log = createLogger('app');
/**
 * Fastify app factory
 * Creates and configures a new Fastify instance
 * Exported for testing purposes
 */
export async function createApp() {
    const fastify = Fastify({
        logger: false, // Use Winston instead of Pino for app logs
        requestIdLogLabel: 'requestId',
        disableRequestLogging: false,
        bodyLimit: 1048576, // 1MB default
        trustProxy: true,
    });
    // Register core plugins
    log.info('Registering core plugins...');
    // Database & cache
    await fastify.register(import('./plugins/prisma.js').then((m) => m.default));
    await fastify.register(import('./plugins/redis.js').then((m) => m.default));
    // Security & validation
    await fastify.register(import('./plugins/auth.js').then((m) => m.default));
    await fastify.register(import('./plugins/cors.js').then((m) => m.default));
    await fastify.register(import('./plugins/rate-limit.js').then((m) => m.default));
    // Request handling
    await fastify.register(import('./plugins/request-context.js').then((m) => m.default));
    await fastify.register(import('./plugins/idempotency.js').then((m) => m.default));
    await fastify.register(import('./plugins/compress.js').then((m) => m.default));
    await fastify.register(import('./plugins/multipart.js').then((m) => m.default));
    // Documentation
    await fastify.register(import('./plugins/swagger.js').then((m) => m.default));
    // Error handling (must be last plugin)
    await fastify.register(import('./plugins/error-handler.js').then((m) => m.default));
    // Health check endpoints
    log.info('Registering health check endpoints...');
    fastify.get('/health', async (request, reply) => {
        return reply.send({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
        });
    });
    fastify.get('/health/ready', async (request, reply) => {
        try {
            // Check database
            await fastify.prisma.$queryRaw `SELECT 1`;
            // Check Redis
            await fastify.redis.ping();
            return reply.send({ status: 'ready' });
        }
        catch (error) {
            return reply.status(503).send({ status: 'not_ready' });
        }
    });
    fastify.get('/health/live', async (request, reply) => {
        return reply.send({ status: 'alive' });
    });
    // Register all module routes
    log.info('Registering module routes...');
    await registerRoutes(fastify);
    log.info('✅ Fastify app initialized successfully');
    return fastify;
}
//# sourceMappingURL=app.js.map