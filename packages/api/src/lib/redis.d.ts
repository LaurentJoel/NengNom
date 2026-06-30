import Redis from 'ioredis';
export declare function getRedisClient(): Redis;
/**
 * Gracefully disconnect Redis
 */
export declare function disconnectRedis(): Promise<void>;
declare const _default: Redis;
export default _default;
//# sourceMappingURL=redis.d.ts.map