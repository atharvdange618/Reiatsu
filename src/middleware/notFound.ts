import { NotFoundError } from "../errors/AppError";
import { Middleware } from "../types/http";

export const notFoundMiddleware: Middleware = async (ctx, next) => {
  await next();

  if (!ctx.res.headersSent && ctx.res.statusCode === 200) {
    throw new NotFoundError("Route");
  }
};
