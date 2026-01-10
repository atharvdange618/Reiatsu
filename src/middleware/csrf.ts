import { randomBytes } from "crypto";
import { Middleware } from "../types/http";
import { Context } from "../core/context";

/**
 * Configuration options for CSRF protection middleware
 */
export interface CSRFOptions {
  /**
   * Name of the cookie used to store the CSRF token
   * @default "csrf-token"
   */
  cookieName?: string;

  /**
   * Name of the HTTP header containing the CSRF token
   * @default "x-csrf-token"
   */
  headerName?: string;

  /**
   * HTTP methods that don't require CSRF validation
   * Safe methods (GET, HEAD, OPTIONS) typically don't modify data
   * @default ["GET", "HEAD", "OPTIONS"]
   */
  ignoreMethods?: string[];

  /**
   * Token length in bytes (will be hex-encoded to 2x this length)
   * @default 32
   */
  tokenLength?: number;

  /**
   * Cookie options for the CSRF token cookie
   */
  cookieOptions?: {
    path?: string;
    maxAge?: number;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
  };
}

/**
 * Extended context with CSRF token
 */
interface CSRFContext extends Context {
  csrfToken?: string;
}

/**
 * Creates a CSRF protection middleware to prevent Cross-Site Request Forgery attacks.
 *
 * This middleware implements the Double Submit Cookie pattern:
 * 1. For safe methods (GET, HEAD, OPTIONS), it generates a random token and stores it in a cookie
 * 2. For unsafe methods (POST, PUT, DELETE, etc.), it validates that the token from the cookie
 *    matches the token sent in the request header
 * 3. The token is also attached to the context so it can be embedded in forms
 *
 * @param options - CSRF protection configuration options
 * @returns A middleware function that handles CSRF token generation and validation
 *
 * @example
 * ```typescript
 * import { createCSRFMiddleware } from "reiatsu";
 *
 * // Use default settings
 * app.use(createCSRFMiddleware());
 *
 * // Custom configuration
 * app.use(createCSRFMiddleware({
 *   cookieName: "xsrf-token",
 *   headerName: "x-xsrf-token",
 *   ignoreMethods: ["GET", "HEAD", "OPTIONS"],
 *   cookieOptions: {
 *     secure: true,
 *     sameSite: "Strict"
 *   }
 * }));
 *
 * // In your HTML template, include the token:
 * router.get("/form", (ctx) => {
 *   ctx.html(`
 *     <form method="POST" action="/submit">
 *       <input type="hidden" name="_csrf" value="${ctx.csrfToken}">
 *       <!-- form fields -->
 *       <button type="submit">Submit</button>
 *     </form>
 *   `);
 * });
 *
 * // For AJAX requests, send the token in the header:
 * fetch("/api/data", {
 *   method: "POST",
 *   headers: {
 *     "X-CSRF-Token": getCookie("csrf-token"),
 *     "Content-Type": "application/json"
 *   },
 *   body: JSON.stringify(data)
 * });
 * ```
 *
 * @remarks
 * - The token is regenerated on each safe request (GET, HEAD, OPTIONS)
 * - Tokens should be sent via header for AJAX requests and hidden input for forms
 * - Use `sameSite: "Strict"` for maximum security
 * - HTTPS is strongly recommended when using CSRF protection
 * - The token is available as `ctx.csrfToken` for embedding in templates
 *
 * @security
 * - Always use HTTPS in production to prevent token theft
 * - Set `sameSite: "Strict"` or `"Lax"` to prevent token leakage
 * - Combine with CORS middleware for API endpoints
 * - Rotate tokens periodically for sensitive operations
 */
export const createCSRFMiddleware = (options: CSRFOptions = {}): Middleware => {
  const {
    cookieName = "csrf-token",
    headerName = "x-csrf-token",
    ignoreMethods = ["GET", "HEAD", "OPTIONS"],
    tokenLength = 32,
    cookieOptions = {
      httpOnly: true,
      sameSite: "Strict" as const,
      path: "/",
    },
  } = options;

  return async (ctx: CSRFContext, next) => {
    const method = ctx.req.method?.toUpperCase() || "GET";

    if (ignoreMethods.includes(method)) {
      const token = randomBytes(tokenLength).toString("hex");

      ctx.cookie(cookieName, token, cookieOptions);

      ctx.csrfToken = token;

      return await next();
    }

    const cookieToken = ctx.cookies[cookieName];
    const headerToken = ctx.req.headers[headerName] as string;

    if (!cookieToken) {
      ctx.status(403).json({
        error: "CSRF token missing",
        code: "CSRF_TOKEN_MISSING",
        message: "CSRF token not found in cookie",
      });
      return;
    }

    if (!headerToken) {
      ctx.status(403).json({
        error: "CSRF token missing",
        code: "CSRF_TOKEN_MISSING",
        message: `CSRF token not found in ${headerName} header`,
      });
      return;
    }

    if (!timingSafeEqual(cookieToken, headerToken)) {
      ctx.status(403).json({
        error: "Invalid CSRF token",
        code: "CSRF_TOKEN_INVALID",
        message: "CSRF token mismatch",
      });
      return;
    }

    ctx.csrfToken = cookieToken;
    await next();
  };
};

/**
 * Timing-safe string comparison to prevent timing attacks
 * Compares two strings in constant time
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Convenience middleware with default settings
 *
 * @example
 * ```typescript
 * import { csrfMiddleware } from "reiatsu";
 *
 * app.use(csrfMiddleware);
 * ```
 */
export const csrfMiddleware: Middleware = createCSRFMiddleware();
