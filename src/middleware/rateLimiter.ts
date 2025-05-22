import { RateLimitError } from "../errors/AppError";
import { Middleware } from "../types/http";

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const createRateLimiter = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Middleware => {
  return async (ctx, next) => {
    const clientId =
      ctx.req.headers["x-forwarded-for"] ||
      ctx.req.connection?.remoteAddress ||
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
