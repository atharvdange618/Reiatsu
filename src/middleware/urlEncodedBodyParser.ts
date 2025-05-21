import querystring from "querystring";
import { Middleware } from "../types/http";

/**
 * Middleware that parses application/x-www-form-urlencoded request bodies
 * and adds the parsed data to ctx.body.
 *
 * Works alongside the JSON body parser.
 */
export const urlEncodedBodyParserMiddleware: Middleware = (ctx, next) => {
  const { req } = ctx;

  // Only parse for POST, PUT, or PATCH requests
  const method = req.method || "";
  const contentType = req.headers["content-type"] || "";

  if (!["POST", "PUT", "PATCH"].includes(method)) {
    return next();
  }

  // Only handle application/x-www-form-urlencoded content type
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return next();
  }

  let rawBody = "";

  req.on("data", (chunk) => {
    rawBody += chunk.toString();
  });

  req.on("end", () => {
    try {
      // Parse the form data using querystring module
      ctx.body = querystring.parse(rawBody);
      next();
    } catch (err) {
      console.error("Form parsing error:", err);
      ctx.res.writeHead(400, { "Content-Type": "application/json" });
      ctx.res.end(JSON.stringify({ error: "Invalid form data" }));
    }
  });
};
