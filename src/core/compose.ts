import { Middleware } from "../types/http";

/**
 * Composes multiple middleware into a single middleware function.
 * Middleware are executed in the order they are provided.
 *
 * This utility allows you to create reusable middleware stacks that can be
 * applied to routes or used as building blocks for more complex middleware chains.
 *
 * @param middlewares - Array of middleware functions to compose
 * @returns A single composed middleware function
 *
 * @example
 * ```typescript
 * import { compose } from "reiatsu";
 *
 * // Create a reusable auth stack
 * const authStack = compose(
 *   requestIdMiddleware,
 *   loggerMiddleware,
 *   authMiddleware("secret")
 * );
 *
 * // Use in routes
 * router.post("/protected", authStack, handler);
 *
 * // Or create more complex stacks
 * const apiStack = compose(
 *   corsMiddleware,
 *   rateLimiter(100),
 *   authStack
 * );
 * ```
 *
 * @remarks
 * - Middleware are executed sequentially in the order provided
 * - Each middleware must call `next()` to proceed to the next one
 * - If any middleware throws an error, execution stops and the error is propagated
 * - Calling `next()` multiple times in the same middleware will throw an error
 */
export function compose(...middlewares: Middleware[]): Middleware {
  if (middlewares.length === 0) {
    return async (ctx, next) => await next();
  }

  if (middlewares.length === 1) {
    return middlewares[0];
  }

  return async (ctx, next) => {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }

      index = i;
      const fn = i === middlewares.length ? next : middlewares[i];

      if (!fn) return;

      await fn(ctx, () => dispatch(i + 1));
    };

    await dispatch(0);
  };
}
