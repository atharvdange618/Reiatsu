import { Handler } from "../types/http";

/**
 * Wraps async route handlers to automatically catch and forward errors
 * to the error handling middleware
 */
export const asyncHandler = (handler: Handler): Handler => {
  return async (ctx) => {
    try {
      await handler(ctx);
    } catch (error) {
      // Re-throw to be caught by error middleware
      throw error;
    }
  };
};
