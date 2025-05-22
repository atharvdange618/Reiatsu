import { Middleware } from "../types/http";

export const responseHelpersMiddleware: Middleware = async (ctx, next) => {
  ctx.status = (code) => {
    ctx.res.statusCode = code;
    return ctx;
  };

  ctx.json = (data) => {
    ctx.res.setHeader("Content-Type", "application/json");
    ctx.res.end(JSON.stringify(data));
  };

  await next();
};
