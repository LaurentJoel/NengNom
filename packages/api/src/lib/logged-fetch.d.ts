export interface LoggedCallContext {
    [key: string]: unknown;
}
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
export declare function loggedCall<T>(serviceName: string, fn: () => Promise<T>, context?: LoggedCallContext): Promise<T>;
/**
 * Wrap external calls with both logging and retries
 */
export declare function loggedCallWithRetry<T>(serviceName: string, fn: () => Promise<T>, maxRetries?: number, context?: LoggedCallContext): Promise<T>;
//# sourceMappingURL=logged-fetch.d.ts.map