import { createLogger } from './logger.js';
const log = createLogger('retry');
/**
 * Retry a function with exponential backoff
 * Ideal for network calls and transient failures
 */
export async function withRetry(fn, options = {}) {
    const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30_000, retryOn = isRetryableError, onRetry, context = 'unknown', } = options;
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries || !retryOn(lastError)) {
                throw lastError;
            }
            const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
            onRetry?.(attempt + 1, lastError);
            log.warn('Retry scheduled', {
                context,
                attempt: attempt + 1,
                maxRetries,
                delayMs: delay,
                error: lastError.message,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
/**
 * Check if an error is retryable (transient failure)
 */
function isRetryableError(error) {
    const retryableCodes = [
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ENETUNREACH',
        'EAI_AGAIN',
    ];
    const code = error.code;
    return ((code !== undefined && retryableCodes.includes(code)) ||
        error.message.includes('timeout') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('socket hang up'));
}
//# sourceMappingURL=retry.js.map