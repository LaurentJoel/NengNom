import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { consultationsRoutes } from './modules/consultations/consultations.routes.js';
import { farmRecordsRoutes } from './modules/farm-records/farm-records.routes.js';
import { healthEventsRoutes } from './modules/health-events/health-events.routes.js';
import { labRequestsRoutes } from './modules/lab-requests/lab-requests.routes.js';
import { communityRoutes } from './modules/community/community.routes.js';
import { surveillanceRoutes } from './modules/surveillance/surveillance.routes.js';
import { aiRoutes } from './modules/ai/ai.routes.js';
/**
 * Register all module routes
 */
export async function registerRoutes(fastify) {
    await authRoutes(fastify);
    await usersRoutes(fastify);
    await consultationsRoutes(fastify);
    await farmRecordsRoutes(fastify);
    await healthEventsRoutes(fastify);
    await labRequestsRoutes(fastify);
    await communityRoutes(fastify);
    await surveillanceRoutes(fastify);
    await aiRoutes(fastify);
}
//# sourceMappingURL=routes.js.map