import { CorsOptions, Middleware } from "../types/http";

const DEFAULT_CORS_OPTIONS: Required<CorsOptions> = {
  origin: "*",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400,
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

    // Handle preflight requests
    if (requestMethod === "OPTIONS") {
      const methods = Array.isArray(config.methods)
        ? config.methods.join(", ")
        : config.methods;
      ctx.res.setHeader("Access-Control-Allow-Methods", methods);

      const requestHeaders = ctx.req.headers["access-control-request-headers"];
      if (requestHeaders) {
        const allowedHeaders = Array.isArray(config.allowedHeaders)
          ? config.allowedHeaders.join(", ")
          : config.allowedHeaders;
        ctx.res.setHeader("Access-Control-Allow-Headers", allowedHeaders);
      }

      if (config.maxAge > 0) {
        ctx.res.setHeader("Access-Control-Max-Age", config.maxAge.toString());
      }

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
   *
   * @security WARNING: This reflects any request origin, effectively disabling CORS.
   * Only use in development environments. Never use in production.
   */
  development: (): Middleware =>
    createCorsMiddleware({
      origin: true,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    }),

  /**
   * Production preset - more restrictive defaults
   *
   * @param allowedOrigins - Array of allowed origins (e.g., ['https://myapp.com'])
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
 *
 * @security When configOrigin is `true`, this reflects the request origin,
 * which effectively disables CORS protection. Only use in development or
 * when you explicitly want to allow all origins.
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

  // If origin is an array - validate against whitelist
  if (Array.isArray(configOrigin)) {
    return configOrigin.includes(requestOrigin) ? requestOrigin : null;
  }

  // If origin is a function - custom validation
  if (typeof configOrigin === "function") {
    return configOrigin(requestOrigin) ? requestOrigin : null;
  }

  return null;
}

/**
 * Simple CORS middleware with defaults
 */
export const corsMiddleware: Middleware = createCorsMiddleware();
