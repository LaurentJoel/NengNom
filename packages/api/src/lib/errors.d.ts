/**
 * Custom error hierarchy for the application
 * All errors should extend AppError for consistent handling
 */
export declare class AppError extends Error {
    readonly code: string;
    readonly message: string;
    readonly statusCode: number;
    readonly details?: unknown | undefined;
    constructor(code: string, message: string, statusCode: number, details?: unknown | undefined);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, id?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    constructor(details: unknown);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(service: string);
}
export declare class RateLimitError extends AppError {
    constructor();
}
export declare class InvalidInputError extends AppError {
    constructor(message: string, details?: unknown);
}
export declare function isAppError(error: unknown): error is AppError;
//# sourceMappingURL=errors.d.ts.map