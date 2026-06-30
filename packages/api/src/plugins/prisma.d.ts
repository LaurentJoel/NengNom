import { getPrismaClient } from '../lib/prisma.js';
/**
 * Fastify plugin to inject Prisma client as a singleton
 * Accessed via fastify.prisma throughout the app
 */
declare const _default: any;
export default _default;
declare global {
    namespace FastifyInstance {
        interface FastifyInstance {
            prisma: ReturnType<typeof getPrismaClient>;
        }
    }
}
//# sourceMappingURL=prisma.d.ts.map