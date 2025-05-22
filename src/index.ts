import { use } from "./core/router";
import { startServer } from "./core/server";
import { bodyParserMiddleware } from "./middleware/bodyParser";
import { corsPresets } from "./middleware/cors";
import { errorHandlerMiddleware } from "./middleware/errorHandler";
import {
  createLoggerMiddleware,
  devLoggerMiddleware,
  loggerMiddleware,
} from "./middleware/logger";
import { createRateLimiter } from "./middleware/rateLimiter";
import { createRequestIdMiddleware } from "./middleware/requestId";
import { createRequestSizeLimiter } from "./middleware/requestSize";
import { createTimeoutMiddleware } from "./middleware/requestTimeout";
import { responseHelpersMiddleware } from "./middleware/responseHelpers";
import { createSecurityHeadersMiddleware } from "./middleware/security";
import { serveStatic } from "./middleware/static";

// Environment-specific configuration
const isDevelopment = process.env.NODE_ENV !== "production";

use(errorHandlerMiddleware);

// Core middleware
use(createTimeoutMiddleware(30000)); // 30 second timeout
use(createRateLimiter(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
use(createRequestSizeLimiter(2 * 1024 * 1024)); // 2MB limit
use(createSecurityHeadersMiddleware()); // Security headers

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

// Response helpers and body parsing
use(responseHelpersMiddleware);
use(bodyParserMiddleware);

// Static file serving
use(serveStatic("public"));

import "./routes";

const port = parseInt(process.env.PORT || "3000", 10);

startServer(port);

console.log(
  `🚀 Sage framework started in ${
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
