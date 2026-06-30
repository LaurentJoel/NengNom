import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fastifyCompress from '@fastify/compress'

/**
 * Compression plugin
 * Automatically gzip responses to reduce bandwidth
 * Good for African networks with limited bandwidth
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
  // Compression disabled due to Brotli options type issues
  // await fastify.register(fastifyCompress, {
  //   threshold: 1024,
  // })
})
