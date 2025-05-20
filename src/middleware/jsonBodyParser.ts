import { Middleware } from "../types/http";

/**
 * Only parses JSON for POST or PUT requests.
 * Buffers incoming chunks
 * Parses JSON safely
 * Attaches the result to ctx.body
 * Short-circuits with 400 on parse error
 */

export const jsonBodyParserMiddleware: Middleware = (ctx, next) => {
  const { req } = ctx;

  // Only parse JSON for POST or PUT requests
  const method = req.method || "";
  const contentType = req.headers["content-type"] || "";

  if (method !== "POST" && method !== "PUT") {
    return next();
  }

  if (!contentType.includes("application/json")) {
    return next();
  }

  let rawBody = "";

  req.on("data", (chunk) => {
    rawBody += chunk.toString();
  });

  req.on("end", () => {
    try {
      ctx.body = JSON.parse(rawBody);
    } catch (err) {
      ctx.res.writeHead(400, { "Content-Type": "application/json" });
      ctx.res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    next();
  });
};
