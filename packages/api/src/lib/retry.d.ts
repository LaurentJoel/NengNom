export interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    retryOn?: (error: Error) => boolean;
    onRetry?: (attempt: number, error: Error) => void;
    context?: string;
}
/**
 * Retry a function with exponential backoff
 * Ideal for network calls and transient failures
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
//# sourceMappingURL=retry.d.ts.map