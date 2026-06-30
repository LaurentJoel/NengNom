import fastifyPlugin from 'fastify-plugin';
import { getPrismaClient } from '../lib/prisma.js';
/**
 * Fastify plugin to inject Prisma client as a singleton
 * Accessed via fastify.prisma throughout the app
 */
export default fastifyPlugin(async (fastify) => {
    const prisma = getPrismaClient();
    fastify.decorate('prisma', prisma);
    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
});
//# sourceMappingURL=prisma.js.map