import { AppError } from "../errors/AppError";
import { Middleware } from "../types/http";

export const createTimeoutMiddleware = (
  timeoutMs: number = 30000
): Middleware => {
  return async (_, next) => {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new AppError(
            `Request timeout after ${timeoutMs}ms`,
            408,
            "REQUEST_TIMEOUT"
          )
        );
      }, timeoutMs);
    });

    try {
      await Promise.race([next(), timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  };
};
