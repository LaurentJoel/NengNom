import { createApp } from './app.js';
import { config } from './config/env.js';
import { createLogger } from './lib/logger.js';
const log = createLogger('server');
async function start() {
    try {
        const fastify = await createApp();
        await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
        log.info(`🚀 Server running at http://localhost:${config.PORT}`, {
            env: config.NODE_ENV,
            port: config.PORT,
        });
        log.info('📚 API Docs available at http://localhost:3001/docs');
    }
    catch (error) {
        log.error('Failed to start server', {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map