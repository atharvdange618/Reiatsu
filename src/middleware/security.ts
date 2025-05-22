import { Middleware } from "../types/http";

export const createSecurityHeadersMiddleware =
  (): Middleware => async (ctx, next) => {
    ctx.res.setHeader("X-Content-Type-Options", "nosniff");
    ctx.res.setHeader("X-Frame-Options", "DENY");
    ctx.res.setHeader("X-XSS-Protection", "1; mode=block");
    ctx.res.setHeader("Strict-Transport-Security", "max-age=31536000");
    await next();
  };

/**
 * Convenience middleware with default options
 */
export const securityHeadersMiddleware: Middleware =
  createSecurityHeadersMiddleware();
