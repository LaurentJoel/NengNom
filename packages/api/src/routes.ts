import { FastifyInstance } from 'fastify'
import { authRoutes } from './modules/auth/auth.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { consultationsRoutes } from './modules/consultations/consultations.routes.js'
import { farmRecordsRoutes } from './modules/farm-records/farm-records.routes.js'
import { healthEventsRoutes } from './modules/health-events/health-events.routes.js'
import { labRequestsRoutes } from './modules/lab-requests/lab-requests.routes.js'
import { communityRoutes } from './modules/community/community.routes.js'
import { aiRoutes } from './modules/ai/ai.routes.js'
import { adminRoutes } from './modules/admin/admin.routes.js'
import { mediaRoutes } from './modules/media/media.routes.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
  await fastify.register(usersRoutes)
  await fastify.register(consultationsRoutes)
  await fastify.register(farmRecordsRoutes)
  await fastify.register(healthEventsRoutes)
  await fastify.register(labRequestsRoutes)
  await fastify.register(communityRoutes)
  await fastify.register(aiRoutes)
  await fastify.register(adminRoutes)
  await fastify.register(mediaRoutes)
}
