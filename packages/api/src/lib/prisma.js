import { PrismaClient } from '@prisma/client';
import { createLogger } from './logger.js';
const log = createLogger('prisma');
/**
 * Singleton Prisma client instance
 * Reused across the application to maintain connection pooling
 */
let prisma;
export function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient({
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
            ],
        });
        // Log slow queries (> 1s)
        prisma.$on('query', (e) => {
            if (e.duration > 1000) {
                log.warn('Slow query detected', {
                    query: e.query.substring(0, 100),
                    duration: e.duration,
                });
            }
        });
        prisma.$on('error', (e) => {
            log.error('Prisma error', {
                message: e.message,
            });
        });
    }
    return prisma;
}
/**
 * Gracefully disconnect Prisma
 */
export async function disconnectPrisma() {
    if (prisma) {
        await prisma.$disconnect();
    }
}
export default getPrismaClient();
//# sourceMappingURL=prisma.js.map