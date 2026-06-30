import fastifyJwt from '@fastify/jwt';
import fastifyPlugin from 'fastify-plugin';
import { config } from '../config/env.js';
import { createLogger } from '../lib/logger.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
const log = createLogger('auth-plugin');
/**
 * JWT authentication plugin
 * - Access tokens: 15min TTL
 * - Refresh tokens: 7d TTL stored in Redis
 * - RBAC via fastify.authorize middleware
 */
export default fastifyPlugin(async (fastify) => {
    await fastify.register(fastifyJwt, {
        secret: config.JWT_ACCESS_SECRET,
        sign: {
            expiresIn: config.JWT_ACCESS_TTL,
        },
    });
    /**
     * Decorator: authenticate — verifies JWT and extracts user
     */
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify();
        }
        catch (error) {
            log.warn('JWT verification failed', {
                error: error.message,
            });
            throw new UnauthorizedError('Invalid or expired token');
        }
    });
    /**
     * Decorator: authorize(...roles) — checks user role
     */
    fastify.decorate('authorize', (...allowedRoles) => async (request, reply) => {
        await fastify.authenticate(request, reply);
        if (!request.user || !allowedRoles.includes(request.user.role)) {
            log.warn('Authorization failed', {
                userId: request.user?.id,
                userRole: request.user?.role,
                allowedRoles,
            });
            throw new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
        }
    });
    log.info('JWT authentication plugin registered');
});
//# sourceMappingURL=auth.js.map