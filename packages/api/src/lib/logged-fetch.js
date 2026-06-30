import { createLogger } from './logger.js';
const log = createLogger('external-service');
/**
 * Wrap external API calls with consistent logging
 * Logs latency, success/failure, and context for observability
 *
 * Usage:
 * ```
 * await loggedCall('groq.completion', () => groq.chat(...), {
 *   farmerId,
 *   model,
 *   promptLength: 850
 * })
 * ```
 */
export async function loggedCall(serviceName, fn, context = {}) {
    const start = Date.now();
    try {
        const result = await fn();
        const latencyMs = Date.now() - start;
        log.info(`${serviceName} call succeeded`, {
            service: serviceName,
            latencyMs,
            ...context,
        });
        return result;
    }
    catch (error) {
        const latencyMs = Date.now() - start;
        log.error(`${serviceName} call failed`, {
            service: serviceName,
            latencyMs,
            error: error.message,
            errorCode: error.code,
            ...context,
        });
        throw error;
    }
}
/**
 * Wrap external calls with both logging and retries
 */
export async function loggedCallWithRetry(serviceName, fn, maxRetries = 3, context = {}) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await loggedCall(serviceName, fn, {
                ...context,
                attempt: attempt + 1,
            });
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                const delayMs = Math.min(1000 * Math.pow(2, attempt), 30_000);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=logged-fetch.js.map