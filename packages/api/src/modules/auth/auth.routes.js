import { AuthService } from './auth.service.js';
import { RegisterSchema, LoginSchema, RefreshTokenSchema, AuthResponseSchema, ErrorResponseSchema, } from './auth.schema.js';
/**
 * Auth routes — thin HTTP adapter
 * Parses requests, calls service, returns responses
 */
export async function authRoutes(fastify) {
    const authService = new AuthService(fastify.prisma, fastify.redis, fastify.config);
    fastify.withTypeProvider();
    /**
     * POST /auth/register
     * Register a new user account
     */
    fastify.post('/auth/register', {
        schema: {
            tags: ['Auth'],
            summary: 'Register a new user account',
            body: RegisterSchema,
            response: {
                201: AuthResponseSchema,
                409: ErrorResponseSchema,
                422: ErrorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const result = await authService.register(request.body);
        return reply.status(201).send(result);
    });
    /**
     * POST /auth/login
     * Login with email and password
     */
    fastify.post('/auth/login', {
        schema: {
            tags: ['Auth'],
            summary: 'Login with email and password',
            body: LoginSchema,
            response: {
                200: AuthResponseSchema,
                401: ErrorResponseSchema,
                422: ErrorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const result = await authService.login(request.body);
        return reply.status(200).send(result);
    });
    /**
     * POST /auth/refresh
     * Refresh access token using refresh token
     */
    fastify.post('/auth/refresh', {
        schema: {
            tags: ['Auth'],
            summary: 'Refresh access token',
            body: RefreshTokenSchema,
            response: {
                200: AuthResponseSchema,
                401: ErrorResponseSchema,
                422: ErrorResponseSchema,
            },
        },
    }, async (request, reply) => {
        const result = await authService.refreshToken(request.body.refreshToken);
        return reply.status(200).send(result);
    });
    /**
     * POST /auth/logout
     * Logout — invalidate refresh token
     */
    fastify.post('/auth/logout', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Auth'],
            summary: 'Logout and invalidate refresh token',
            response: {
                204: {},
                401: ErrorResponseSchema,
            },
        },
    }, async (request, reply) => {
        await authService.logout(request.user.id);
        return reply.status(204).send();
    });
}
//# sourceMappingURL=auth.routes.js.map