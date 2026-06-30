import fastifyPlugin from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import { RATE_LIMITS } from '../config/constants.js';
import { getRedisClient } from '../lib/redis.js';
import { RateLimitError } from '../lib/errors.js';
/**
 * Rate limiting plugin
 * Protects against abuse using Redis for distributed rate limiting
 * - Global limit: 100 req/15min per IP
 * - Auth endpoints: stricter limits
 */
export default fastifyPlugin(async (fastify) => {
    const redis = getRedisClient();
    await fastify.register(fastifyRateLimit, {
        max: RATE_LIMITS.DEFAULT_MAX,
        timeWindow: RATE_LIMITS.DEFAULT_TIMEFRAME,
        redis,
        allowList: ['127.0.0.1'],
        errorResponseBuilder: () => {
            throw new RateLimitError();
        },
    });
});
//# sourceMappingURL=rate-limit.js.map