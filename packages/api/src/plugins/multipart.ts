import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fastifyMultipart from '@fastify/multipart'

/**
 * Multipart form data plugin
 * Handles file uploads (images, documents, etc.)
 */
export default fastifyPlugin(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 1024 * 1024, // 1MB per field
      fields: 10,
      fileSize: 100 * 1024 * 1024, // 100MB per file
      files: 5,
      headerPairs: 2000,
      parts: 1000,
    },
  })
})
