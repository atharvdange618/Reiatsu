import { Middleware } from "../types/http";

export const loggerMiddleware: Middleware = async (ctx, next) => {
  const { method, url } = ctx.req;
  const start = Date.now();

  console.log(`--> ${method} ${url}`);

  await next();

  const duration = Date.now() - start;
  console.log(`<-- ${method} ${url} ${duration}ms`);
};
