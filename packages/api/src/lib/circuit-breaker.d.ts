import CircuitBreaker from 'opossum';
/**
 * Create a circuit breaker for an external service
 * Prevents cascading failures by failing fast when a service is down
 */
export declare function createBreaker<T extends (...args: any[]) => Promise<any>>(fn: T, name: string): CircuitBreaker;
/**
 * Pre-instantiated circuit breakers for external services
 * Each service gets its own breaker with independent state
 */
export declare const groqBreaker: CircuitBreaker;
export declare const cloudinaryBreaker: CircuitBreaker;
export declare const emailBreaker: CircuitBreaker;
export declare const smsBreaker: CircuitBreaker;
//# sourceMappingURL=circuit-breaker.d.ts.map