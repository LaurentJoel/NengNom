/**
 * Custom error hierarchy for the application
 * All errors should extend AppError for consistent handling
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      `${resource}${id ? ` (${id})` : ''} not found`,
      404
    )
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403)
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('VALIDATION_ERROR', 'Invalid data', 422, details)
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(
      'SERVICE_UNAVAILABLE',
      `${service} is temporarily unavailable. Please try again in a few minutes.`,
      503
    )
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests. Please wait before trying again.',
      429
    )
  }
}

export class InvalidInputError extends AppError {
  constructor(message: string, details?: unknown) {
    super('INVALID_INPUT', message, 400, details)
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
