/**
 * Idempotency utilities
 * Helpers for generating and validating Idempotency-Key headers
 */
/**
 * Generate an idempotency key (UUID v4)
 */
export declare function generateIdempotencyKey(): string;
/**
 * Validate idempotency key format (UUID v4)
 */
export declare function isValidIdempotencyKey(key: string): boolean;
/**
 * Extract idempotency key from request headers
 */
export declare function getIdempotencyKey(headers: Record<string, string | string[] | undefined>): string | null;
//# sourceMappingURL=idempotency.d.ts.map