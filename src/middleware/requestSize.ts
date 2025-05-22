import { AppError } from "../errors/AppError";
import { Middleware } from "../types/http";

export const createRequestSizeLimiter = (
  maxSizeBytes: number = 1024 * 1024
): Middleware => {
  return async (ctx, next) => {
    const contentLength = ctx.req.headers["content-length"];

    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      throw new AppError(
        `Request entity too large. Maximum size: ${maxSizeBytes} bytes`,
        413,
        "REQUEST_TOO_LARGE"
      );
    }

    await next();
  };
};
