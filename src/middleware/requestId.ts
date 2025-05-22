import { randomBytes } from "crypto";
import { Middleware } from "../types/http";

export interface RequestIdOptions {
  /**
   * Header name to read existing request ID from
   * @default "x-request-id"
   */
  header?: string;

  /**
   * Whether to generate a new ID if none exists in headers
   * @default true
   */
  generate?: boolean;

  /**
   * Custom ID generator function
   * @default undefined (uses built-in generator)
   */
  generator?: () => string;

  /**
   * Whether to set the request ID in response headers
   * @default true
   */
  setResponseHeader?: boolean;

  /**
   * Response header name for the request ID
   * @default "x-request-id"
   */
  responseHeader?: string;
}

const DEFAULT_REQUEST_ID_OPTIONS: Required<RequestIdOptions> = {
  header: "x-request-id",
  generate: true,
  generator: generateRequestId,
  setResponseHeader: true,
  responseHeader: "x-request-id",
};

/**
 * Creates a request ID middleware with the specified options
 */
export const createRequestIdMiddleware = (
  options: RequestIdOptions = {}
): Middleware => {
  const config = { ...DEFAULT_REQUEST_ID_OPTIONS, ...options };

  return async (ctx, next) => {
    let requestId: string | undefined;

    const headerValue = ctx.req.headers[config.header.toLowerCase()];
    if (headerValue && typeof headerValue === "string") {
      requestId = headerValue.trim();
    }

    // Generate new ID if none exists and generation is enabled
    if (!requestId && config.generate) {
      requestId = config.generator();
    }

    // Set request ID in context
    if (requestId) {
      ctx.requestId = requestId;

      // Set response header
      if (config.setResponseHeader) {
        ctx.res.setHeader(config.responseHeader, requestId);
      }
    }

    await next();
  };
};

/**
 * Default request ID generator
 * Creates a URL-safe base64 string from random bytes
 */
function generateRequestId(): string {
  try {
    // Use crypto.randomUUID if available (Node.js 14.17+)
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    // Fall back to custom implementation
  }

  // Fallback: generate random hex string
  return randomBytes(16).toString("hex");
}

/**
 * Convenience middleware with default options
 */
export const requestIdMiddleware: Middleware = createRequestIdMiddleware();

/**
 * Utility function to get request ID from context
 */
export const getRequestId = (ctx: any): string | undefined => {
  return ctx.requestId;
};
