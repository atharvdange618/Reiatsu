// src/core/middleware.ts
import { Context, Handler, Middleware } from "../types/http";

/**
 * Executes middleware functions in order, then the final handler.
 * Fully promise-based to handle async middleware properly.
 */
export async function runMiddlewares(
  ctx: Context,
  middlewares: Middleware[],
  handler: Handler
): Promise<void> {
  const runNext = async (index: number): Promise<void> => {
    if (index < middlewares.length) {
      const middleware = middlewares[index];

      // Create the next function that the middleware will call
      const next = () => runNext(index + 1);

      // Execute middleware and await if it returns a promise
      await middleware(ctx, next);
    } else {
      // Call the route handler
      await handler(ctx);
    }
  };

  await runNext(0);
}
