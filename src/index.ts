// Framework
export { serve, setupGracefulShutdown } from "./core/server";
export { router, use } from "./core/router";
export { compose } from "./core/compose";

// Context
export { Context } from "./core/context";

// Validator
export { BaseValidator } from "./validator/core";
export { StringValidator, NumberValidator } from "./validator/primitives";
export { ObjectValidator, ArrayValidator } from "./validator/compound";
export type { ValidationError, ValidationResult } from "./validator/core";

// Middleware
export { authMiddleware } from "./middleware/auth";
export { bodyParserMiddleware } from "./middleware/bodyParser";
export { cache } from "./middleware/cache";
export { corsPresets, createCorsMiddleware } from "./middleware/cors";
export { errorHandlerMiddleware } from "./middleware/errorHandler";
export {
  createLoggerMiddleware,
  devLoggerMiddleware,
} from "./middleware/logger";
export { notFoundMiddleware } from "./middleware/notFound";
export { createRateLimiter } from "./middleware/rateLimiter";
export { createRequestIdMiddleware } from "./middleware/requestId";
export { createRequestSizeLimiter } from "./middleware/requestSize";
export { createTimeoutMiddleware } from "./middleware/requestTimeout";
export {
  createSecurityHeadersMiddleware,
  securityHeadersMiddleware,
} from "./middleware/security";
export type { SecurityHeadersOptions } from "./middleware/security";
export { serveStatic } from "./middleware/static";
export { uploadMiddleware } from "./middleware/upload";
export { downloadHelperMiddleware } from "./middleware/download";
export {
  createCompressionMiddleware,
  type CompressionOptions,
} from "./middleware/compression";
export {
  createCSRFMiddleware,
  csrfMiddleware,
  type CSRFOptions,
} from "./middleware/csrf";

// Types
export type { Handler, Middleware } from "./types/http";
export type {
  AuthContext,
  RequestIdContext,
  UploadContext,
  BodyContext,
} from "./types/custom-context";

// Utilities
export * from "./utils/asyncHandler";
export * from "./utils/bufferRequest";
export * from "./utils/mime";
export * from "./utils/parseMultipartFormData";
export * from "./utils/saveFileToDisk";
export * from "./utils/sanitize";

// Errors
export * from "./errors/AppError";

// Auth helpers
export * from "./auth/jwt";
export * from "./auth/types";
export * from "./auth/utils";
