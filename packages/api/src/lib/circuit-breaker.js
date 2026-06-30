import CircuitBreaker from 'opossum';
import { createLogger } from './logger.js';
import { ServiceUnavailableError } from './errors.js';
import { CIRCUIT_BREAKER } from '../config/constants.js';
const log = createLogger('circuit-breaker');
/**
 * Create a circuit breaker for an external service
 * Prevents cascading failures by failing fast when a service is down
 */
export function createBreaker(fn, name) {
    const breaker = new CircuitBreaker(fn, {
        timeout: CIRCUIT_BREAKER.TIMEOUT,
        errorThresholdPercentage: CIRCUIT_BREAKER.ERROR_THRESHOLD_PERCENTAGE,
        resetTimeout: CIRCUIT_BREAKER.RESET_TIMEOUT,
        volumeThreshold: CIRCUIT_BREAKER.VOLUME_THRESHOLD,
        name,
    });
    breaker.on('open', () => {
        log.warn('Circuit breaker OPEN — service unavailable', { service: name });
    });
    breaker.on('halfOpen', () => {
        log.info('Circuit breaker HALF-OPEN — testing service recovery', {
            service: name,
        });
    });
    breaker.on('close', () => {
        log.info('Circuit breaker CLOSED — service recovered', { service: name });
    });
    breaker.on('timeout', () => {
        log.warn('Circuit breaker timeout', { service: name });
    });
    // Fallback: throw ServiceUnavailableError when circuit is open
    breaker.fallback(() => {
        throw new ServiceUnavailableError(name);
    });
    return breaker;
}
/**
 * Pre-instantiated circuit breakers for external services
 * Each service gets its own breaker with independent state
 */
export const groqBreaker = createBreaker(async (fn) => fn(), 'Groq');
export const cloudinaryBreaker = createBreaker(async (fn) => fn(), 'Cloudinary');
export const emailBreaker = createBreaker(async (fn) => fn(), 'Resend Email');
export const smsBreaker = createBreaker(async (fn) => fn(), 'Africa\'s Talking SMS');
//# sourceMappingURL=circuit-breaker.js.map