import { UsersService } from './users.service.js';
import { UpdateProfileSchema, UpdateFarmerProfileSchema, UpdateVetProfileSchema, } from './users.schema.js';
/**
 * Users routes
 */
export async function usersRoutes(fastify) {
    const usersService = new UsersService(fastify.prisma);
    /**
     * GET /users/:id
     * Get user profile
     */
    fastify.get('/users/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Get user profile',
            params: { type: 'object', properties: { id: { type: 'string' } } },
        },
    }, async (request, reply) => {
        const user = await usersService.getUser(request.params.id);
        return reply.send(user);
    });
    /**
     * PUT /users/profile
     * Update current user profile
     */
    fastify.put('/users/profile', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Update user profile',
            body: UpdateProfileSchema,
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const result = await usersService.updateProfile(userId, request.body);
        return reply.send(result);
    });
    /**
     * PUT /users/farmer-profile
     * Update farmer profile
     */
    fastify.put('/users/farmer-profile', {
        preHandler: [fastify.authorize('FARMER')],
        schema: {
            tags: ['Users'],
            summary: 'Update farmer profile',
            body: UpdateFarmerProfileSchema,
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const result = await usersService.updateFarmerProfile(userId, request.body);
        return reply.send(result);
    });
    /**
     * PUT /users/vet-profile
     * Update vet profile
     */
    fastify.put('/users/vet-profile', {
        preHandler: [fastify.authorize('VET')],
        schema: {
            tags: ['Users'],
            summary: 'Update vet profile',
            body: UpdateVetProfileSchema,
        },
    }, async (request, reply) => {
        const userId = request.user.id;
        const result = await usersService.updateVetProfile(userId, request.body);
        return reply.send(result);
    });
    /**
     * GET /users/search
     * Search users by name or email
     */
    fastify.get('/users/search', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            summary: 'Search users',
            querystring: {
                type: 'object',
                properties: {
                    q: { type: 'string' },
                    role: { type: 'string' },
                },
                required: ['q'],
            },
        },
    }, async (request, reply) => {
        const { q, role } = request.query;
        const results = await usersService.searchUsers(q, role);
        return reply.send(results);
    });
}
//# sourceMappingURL=users.routes.js.map