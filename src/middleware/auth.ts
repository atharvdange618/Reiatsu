import { AuthenticationError } from "../errors/AppError";
import { Middleware } from "../types/http";

export const authMiddleware: Middleware = async (ctx, next) => {
  const authHeader = ctx.req.headers["authorization"];

  if (authHeader !== "Bearer secrettoken") {
    throw new AuthenticationError("Invalid or missing authentication token");
  }

  await next();
};
