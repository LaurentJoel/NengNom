import fastifyPlugin from 'fastify-plugin';
import { createLogger } from '../lib/logger.js';
import { isAppError } from '../lib/errors.js';
import { ZodError } from 'zod';
const log = createLogger('error-handler');
/**
 * Global error handler
 * Converts all errors to consistent JSON response format
 */
export default fastifyPlugin(async (fastify) => {
    fastify.setErrorHandler(async (error, request, reply) => {
        const requestId = request.id;
        // Handle Zod validation errors
        if (error instanceof ZodError) {
            log.warn('Validation error', {
                requestId,
                errors: error.flatten().fieldErrors,
            });
            return reply.status(422).send({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.flatten().fieldErrors,
                },
                requestId,
                timestamp: new Date().toISOString(),
            });
        }
        // Handle custom AppError
        if (isAppError(error)) {
            log.warn('Application error', {
                requestId,
                code: error.code,
                statusCode: error.statusCode,
                message: error.message,
            });
            return reply.status(error.statusCode).send({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    details: error.details || null,
                },
                requestId,
                timestamp: new Date().toISOString(),
            });
        }
        // Handle unexpected errors
        log.error('Unexpected error', {
            requestId,
            error: error.message,
            stack: error.stack,
        });
        return reply.status(500).send({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: process.env['NODE_ENV'] === 'production'
                    ? 'An unexpected error occurred. Please try again later.'
                    : error.message,
                details: null,
            },
            requestId,
            timestamp: new Date().toISOString(),
        });
    });
});
//# sourceMappingURL=error-handler.js.map