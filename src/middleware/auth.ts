import { Middleware } from "../types/http";

export const authMiddleware: Middleware = (ctx, next) => {
  const authHeader = ctx.req.headers["authorization"];

  // Simple check
  if (authHeader !== "Bearer secrettoken") {
    ctx.res.writeHead(401, {
      "Content-Type": "application/json",
    });
    ctx.res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  next();
};
