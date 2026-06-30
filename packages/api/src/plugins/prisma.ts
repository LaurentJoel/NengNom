import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { getPrismaClient } from '../lib/prisma.js'

/**
 * Fastify plugin to inject Prisma client as a singleton
 * Accessed via fastify.prisma throughout the app
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
  const prisma = getPrismaClient()

  fastify.decorate('prisma', prisma)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    prisma: ReturnType<typeof getPrismaClient>
  }
}
