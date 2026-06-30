import fastifyPlugin from 'fastify-plugin';
import { getRedisClient } from '../lib/redis.js';
/**
 * Fastify plugin to inject Redis client as a singleton
 * Accessed via fastify.redis throughout the app
 */
export default fastifyPlugin(async (fastify) => {
    const redis = getRedisClient();
    fastify.decorate('redis', redis);
    fastify.addHook('onClose', async () => {
        await redis.quit();
    });
});
//# sourceMappingURL=redis.js.map