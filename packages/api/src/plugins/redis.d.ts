import type Redis from 'ioredis';
/**
 * Fastify plugin to inject Redis client as a singleton
 * Accessed via fastify.redis throughout the app
 */
declare const _default: any;
export default _default;
declare global {
    namespace FastifyInstance {
        interface FastifyInstance {
            redis: Redis;
        }
    }
}
//# sourceMappingURL=redis.d.ts.map