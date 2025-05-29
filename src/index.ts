import { use } from "./core/router";
import { serve } from "./core/server";
import { bodyParserMiddleware } from "./middleware/bodyParser";
import { corsPresets } from "./middleware/cors";
import { downloadHelperMiddleware } from "./middleware/download";
import { errorHandlerMiddleware } from "./middleware/errorHandler";
import {
  createLoggerMiddleware,
  devLoggerMiddleware,
} from "./middleware/logger";
import { createRateLimiter } from "./middleware/rateLimiter";
import { requestHelpersMiddleware } from "./middleware/requestHelpers";
import { createRequestIdMiddleware } from "./middleware/requestId";
import { createRequestSizeLimiter } from "./middleware/requestSize";
import { createTimeoutMiddleware } from "./middleware/requestTimeout";
import { responseHelpersMiddleware } from "./middleware/responseHelpers";
import { createSecurityHeadersMiddleware } from "./middleware/security";
import { serveStatic } from "./middleware/static";

// Environment-specific configuration
const isDevelopment = process.env.NODE_ENV !== "production";

use(errorHandlerMiddleware);

// Core helpers
use(responseHelpersMiddleware);
use(requestHelpersMiddleware);

// Request ID tracking
use(createRequestIdMiddleware());

// CORS configuration
if (isDevelopment) {
  // Development: Allow all origins
  use(corsPresets.development());
} else {
  // Production: Specific origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
  use(corsPresets.production(allowedOrigins));
}

// Core middleware
// Security headers
use(createSecurityHeadersMiddleware());

// Request timeout
use(createTimeoutMiddleware(30000)); // 30 second timeout

// Rate limiting
use(createRateLimiter(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Request size limit
use(createRequestSizeLimiter(20 * 1024 * 1024)); // 20MB limit

// Download helper
use(downloadHelperMiddleware());

// Logging
use(
  isDevelopment
    ? devLoggerMiddleware
    : createLoggerMiddleware({
        includeRequestId: true,
        logBody: false,
        logHeaders: false,
      })
);

// Body Parser
use(bodyParserMiddleware);

// Static file serving
use(serveStatic("public"));

import "./routes";

const port = parseInt(process.env.PORT || "3000", 10);

serve(port);

console.log(
  `🚀 Reiatsu framework started in ${
    isDevelopment ? "development" : "production"
  } mode`
);
console.log(
  `📡 CORS: ${
    isDevelopment ? "Development (all origins)" : "Production (restricted)"
  }`
);
console.log(`🔍 Request ID tracking: Enabled`);
console.log(`📊 Logging: ${isDevelopment ? "Verbose" : "Standard"}`);

// Framework
export { serve } from "./core/server";
export { router, use } from "./core/router";

// Middleware
export { requestHelpersMiddleware } from "./middleware/requestHelpers";
export { responseHelpersMiddleware } from "./middleware/responseHelpers";
export { bodyParserMiddleware } from "./middleware/bodyParser";
export { corsPresets } from "./middleware/cors";
export { errorHandlerMiddleware } from "./middleware/errorHandler";
export {
  createLoggerMiddleware,
  devLoggerMiddleware,
} from "./middleware/logger";
export { createRateLimiter } from "./middleware/rateLimiter";
export { createRequestIdMiddleware } from "./middleware/requestId";
export { createRequestSizeLimiter } from "./middleware/requestSize";
export { createTimeoutMiddleware } from "./middleware/requestTimeout";
export { createSecurityHeadersMiddleware } from "./middleware/security";
export { serveStatic } from "./middleware/static";

// Types
export type { Context, Handler, Middleware } from "./types/http";

// Utilities
export * from "./utils/asyncHandler";
export * from "./utils/bufferRequest";
export * from "./utils/context";
export * from "./utils/mime";
export * from "./utils/parseMultipartFormData";
export * from "./utils/saveFileToDisk";
export * from "./utils/validation";

// Errors
export * from "./errors/AppError";

// Auth helpers
export * from "./auth/jwt";
export * from "./auth/types";
export * from "./auth/utils";
