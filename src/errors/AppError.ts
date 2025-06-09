/**
 * Represents a custom application error with additional metadata.
 *
 * Extends the native `Error` class to include HTTP status codes, operational flags,
 * optional error codes, and additional details for enhanced error handling.
 *
 * @example
 * ```typescript
 * throw new AppError('Resource not found', 404, 'NOT_FOUND');
 * ```
 *
 * @remarks
 * Use this class to throw errors that should be handled gracefully by the application.
 *
 * @property statusCode - The HTTP status code associated with the error.
 * @property isOperational - Indicates if the error is operational (expected) or a programming error.
 * @property errorCode - An optional application-specific error code.
 * @property details - Optional additional information about the error.
 *
 * @param message - The error message.
 * @param statusCode - The HTTP status code (default: 500).
 * @param errorCode - An optional application-specific error code.
 * @param isOperational - Whether the error is operational (default: true).
 * @param details - Optional additional error details.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401, "AUTH_ERROR", true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHZ_ERROR", true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND", true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT_ERROR", true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_ERROR", true);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error", details?: any) {
    super(message, 500, "INTERNAL_ERROR", false, details);
  }
}
