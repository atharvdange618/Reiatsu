import querystring from "querystring";
import { Middleware } from "../types/http";

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

  // Return a promise to handle the async body parsing
  return new Promise<void>((resolve, reject) => {
    let rawBody = "";

    req.on("data", (chunk) => {
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
        ctx.res.writeHead(400, { "Content-Type": "application/json" });
        ctx.res.end(
          JSON.stringify({
            error: "Invalid request body",
            details: contentType.includes("application/json")
              ? "Failed to parse JSON"
              : "Failed to parse form data",
          })
        );
        resolve();
      }
    });

    req.on("error", reject);
  });
};
