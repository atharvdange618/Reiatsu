import { RateLimitError } from "../errors/AppError";
import { Middleware } from "../types/http";

const requestCounts = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000);

/**
 * Creates a rate limiting middleware to restrict the number of requests per client within a specified time window.
 *
 * @param maxRequests - The maximum number of requests allowed per client within the time window. Defaults to 100.
 * @param windowMs - The duration of the time window in milliseconds. Defaults to 15 minutes (15 * 60 * 1000 ms).
 * @returns A middleware function that enforces rate limiting based on client IP address.
 *
 * @throws {RateLimitError} If the client exceeds the allowed number of requests within the time window.
 *
 * @example
 * ```typescript
 * app.use(createRateLimiter(50, 10 * 60 * 1000)); // 50 requests per 10 minutes
 * ```
 */
export const createRateLimiter = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Middleware => {
  return async (ctx, next) => {
    const clientId =
      ctx.req.headers["x-forwarded-for"] ||
      ctx.req.socket?.remoteAddress ||
      "unknown";

    const now = Date.now();
    const clientData = requestCounts.get(clientId as string);

    if (!clientData || now > clientData.resetTime) {
      // Reset or create new window
      requestCounts.set(clientId as string, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      clientData.count++;

      if (clientData.count > maxRequests) {
        throw new RateLimitError(
          `Too many requests. Limit: ${maxRequests} per ${
            windowMs / 1000
          } seconds`
        );
      }
    }

    await next();
  };
};
