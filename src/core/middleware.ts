import { Handler, Middleware, ExtractRouteParams } from "../types/http";
import { Context } from "./context";

/**
 * Executes middleware functions in order, then the final handler.
 * Fully promise-based to handle async middleware properly.
 *
 * @param ctx The Context object that will be passed through the middleware chain and to the handler.
 * Its `params` property's type is inferred from the `Path` generic.
 * @param middlewares An array of Middleware functions. These are kept as `Middleware<any>` for flexibility,
 * relying on context augmentation via declaration merging and runtime checks.
 * @param handler The final Handler function for the route. Its `ctx` parameter
 * will be strictly typed based on the `Path`.
 */
export async function runMiddlewares<Path extends string>(
  ctx: Context<ExtractRouteParams<Path>>,
  middlewares: Middleware<any>[],
  handler: Handler<Path, Context<ExtractRouteParams<Path>>>
): Promise<void> {
  const runNext = async (index: number): Promise<void> => {
    if (index < middlewares.length) {
      const middleware = middlewares[index];

      const next = () => runNext(index + 1);

      await middleware(ctx, next);
    } else {
      await handler(ctx);
    }
  };

  await runNext(0);
}
