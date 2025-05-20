import { Middleware } from "../types/http";

export const errorHandlerMiddleware: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    console.error("🔥 Uncaught Error:", err);

    ctx.res.writeHead(500, { "Content-Type": "application/json" });
    ctx.res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
};
