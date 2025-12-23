import querystring from "querystring";
import { Middleware } from "../types/http";

const DEFAULT_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

/**
 * Combined body parser middleware that handles both JSON and URL-encoded data
 * based on the Content-Type header.
 */
export const bodyParserMiddleware: Middleware = (ctx, next) => {
  const { req } = ctx;
  const method = req.method || "";
  const contentType = req.headers["content-type"] || "";

  if (!["POST", "PUT", "PATCH"].includes(method) || !contentType) {
    return next();
  }

  if (contentType.startsWith("multipart/form-data")) {
    return next();
  }

  return new Promise<void>((resolve, reject) => {
    let rawBody = "";
    let size = 0;
    let exceededLimit = false;

    req.on("data", (chunk) => {
      if (exceededLimit) return; // Ignore further data

      size += chunk.length;

      // Prevent memory exhaustion from large payloads
      if (size > DEFAULT_SIZE_LIMIT) {
        exceededLimit = true;
        ctx.status(413).json({
          error: "Request entity too large",
          maxSize: DEFAULT_SIZE_LIMIT,
          received: size,
        });
        resolve();
        return;
      }

      rawBody += chunk.toString();
    });

    req.on("end", async () => {
      try {
        if (contentType.includes("application/json")) {
          ctx.body = JSON.parse(rawBody);
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          ctx.body = querystring.parse(rawBody);
        }

        await next();
        resolve();
      } catch (err) {
        console.error("Body parsing error:", err);
        ctx.status(400).json({
          error: "Invalid request body",
          details: contentType.includes("application/json")
            ? "Failed to parse JSON"
            : "Failed to parse form data",
        });
        resolve();
      }
    });

    req.on("error", reject);
  });
};
