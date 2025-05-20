import { Context, Handler, Middleware } from "../types/http";

/**
 * Executes middleware functions in order, then the final handler.
 */
export function runMiddlewares(
  ctx: Context,
  middlewares: Middleware[],
  handler: Handler
) {
  const run = (index: number): void => {
    if (index < middlewares.length) {
      const middleware = middlewares[index];
      middleware(ctx, () => run(index + 1)); // Call the next middleware
    } else {
      handler(ctx); // No more middleware — call the route handler
    }
  };

  run(0);
}
