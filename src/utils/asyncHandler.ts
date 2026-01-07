import { Context } from "../core/context";
import { Handler, ExtractRouteParams } from "../types/http";

/**
 * Wraps async route handlers to automatically catch and forward errors
 * to the error handling middleware.
 *
 * @deprecated This utility is redundant with native async/await error handling.
 * Errors thrown in async handlers are automatically caught by the middleware chain.
 * This export is kept for backward compatibility but may be removed in v2.0.0.
 *
 * @example
 * // Instead of:
 * router.get('/users', asyncHandler(async (ctx) => { ... }));
 *
 * // Just use:
 * router.get('/users', async (ctx) => { ... });
 */
export const asyncHandler = <Path extends string>(
  handler: Handler<Path, Context<ExtractRouteParams<Path>>>
): Handler<Path, Context<ExtractRouteParams<Path>>> => {
  // Simply return the handler as-is since async/await handles errors naturally
  return handler;
};
