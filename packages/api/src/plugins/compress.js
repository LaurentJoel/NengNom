import fastifyPlugin from 'fastify-plugin';
import fastifyCompress from '@fastify/compress';
/**
 * Compression plugin
 * Automatically gzip responses to reduce bandwidth
 * Good for African networks with limited bandwidth
 */
export default fastifyPlugin(async (fastify) => {
    await fastify.register(fastifyCompress, {
        threshold: 1024, // Only compress payloads > 1KB
        brotliOptions: {
            lgwin: 21,
        },
    });
});
//# sourceMappingURL=compress.js.map