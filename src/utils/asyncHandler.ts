import { Context } from "../core/context";
import { Handler, ExtractRouteParams } from "../types/http";

/**
 * Wraps async route handlers to automatically catch and forward errors
 * to the error handling middleware.
 */
export const asyncHandler = <Path extends string>(
  handler: Handler<Path, Context<ExtractRouteParams<Path>>>
): Handler<Path, Context<ExtractRouteParams<Path>>> => {
  return async (ctx: Context<ExtractRouteParams<Path>>) => {
    try {
      await handler(ctx);
    } catch (error) {
      throw error;
    }
  };
};
