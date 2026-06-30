declare global {
    namespace FastifyInstance {
        interface FastifyInstance {
            authenticate: any;
            authorize: (...roles: string[]) => any;
        }
    }
}
/**
 * JWT authentication plugin
 * - Access tokens: 15min TTL
 * - Refresh tokens: 7d TTL stored in Redis
 * - RBAC via fastify.authorize middleware
 */
declare const _default: any;
export default _default;
//# sourceMappingURL=auth.d.ts.map