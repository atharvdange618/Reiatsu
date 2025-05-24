import { CorsOptions, Middleware } from "../types/http";

const DEFAULT_CORS_OPTIONS: Required<CorsOptions> = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

/**
 * Creates a CORS middleware with the specified options
 */
export const createCorsMiddleware = (options: CorsOptions = {}): Middleware => {
  const config = { ...DEFAULT_CORS_OPTIONS, ...options };

  return async (ctx, next) => {
    const requestOrigin = ctx.req.headers.origin as string;
    const requestMethod = ctx.req.method?.toUpperCase();

    // Handle origin
    const allowedOrigin = getAllowedOrigin(requestOrigin, config.origin);
    if (allowedOrigin !== null) {
      ctx.res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    }

    // Handle credentials
    if (config.credentials) {
      ctx.res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Handle exposed headers
    if (config.exposedHeaders.length > 0) {
      const exposedHeaders = Array.isArray(config.exposedHeaders)
        ? config.exposedHeaders.join(", ")
        : config.exposedHeaders;
      ctx.res.setHeader("Access-Control-Expose-Headers", exposedHeaders);
    }

    // Handle preflight requests (OPTIONS)
    if (requestMethod === "OPTIONS") {
      // Set allowed methods
      const methods = Array.isArray(config.methods)
        ? config.methods.join(", ")
        : config.methods;
      ctx.res.setHeader("Access-Control-Allow-Methods", methods);

      // Set allowed headers
      const requestHeaders = ctx.req.headers["access-control-request-headers"];
      if (requestHeaders) {
        const allowedHeaders = Array.isArray(config.allowedHeaders)
          ? config.allowedHeaders.join(", ")
          : config.allowedHeaders;
        ctx.res.setHeader("Access-Control-Allow-Headers", allowedHeaders);
      }

      // Set max age for preflight cache
      if (config.maxAge > 0) {
        ctx.res.setHeader("Access-Control-Max-Age", config.maxAge.toString());
      }

      // If preflightContinue is false, end the request here
      if (!config.preflightContinue) {
        ctx.res.writeHead(config.optionsSuccessStatus);
        ctx.res.end();
        return;
      }
    }

    await next();
  };
};

/**
 * Convenience function for common CORS configurations
 */
export const corsPresets = {
  /**
   * Development preset - allows all origins and common headers
   */
  development: (): Middleware =>
    createCorsMiddleware({
      origin: true,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }),

  /**
   * Production preset - more restrictive defaults
   */
  production: (allowedOrigins: string[]): Middleware =>
    createCorsMiddleware({
      origin: allowedOrigins,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["X-Request-ID"],
    }),

  /**
   * API preset - for REST APIs
   */
  api: (origins: string[] = ["*"]): Middleware =>
    createCorsMiddleware({
      origin: origins,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
      exposedHeaders: ["X-Request-ID", "X-Rate-Limit-Remaining"],
      maxAge: 3600, // 1 hour
    }),
};

/**
 * Helper function to determine the allowed origin
 */
function getAllowedOrigin(
  requestOrigin: string,
  configOrigin: CorsOptions["origin"]
): string | null {
  if (!requestOrigin) {
    return "*";
  }

  // If origin is a boolean
  if (typeof configOrigin === "boolean") {
    return configOrigin ? requestOrigin : null;
  }

  // If origin is a string
  if (typeof configOrigin === "string") {
    return configOrigin === "*" ? "*" : configOrigin;
  }

  // If origin is an array
  if (Array.isArray(configOrigin)) {
    return configOrigin.includes(requestOrigin) ? requestOrigin : null;
  }

  // If origin is a function
  if (typeof configOrigin === "function") {
    return configOrigin(requestOrigin) ? requestOrigin : null;
  }

  return null;
}

/**
 * Simple CORS middleware with defaults
 */
export const corsMiddleware: Middleware = createCorsMiddleware();
