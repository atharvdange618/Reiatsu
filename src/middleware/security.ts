import { Middleware } from "../types/http";

/**
 * Configuration options for security headers middleware
 */
export interface SecurityHeadersOptions {
  /**
   * Content Security Policy configuration
   * - false: Disable CSP header
   * - true: Use default CSP
   * - string: Custom CSP directives
   * @default "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
   */
  contentSecurityPolicy?: boolean | string;

  /**
   * Referrer-Policy header value
   * Controls how much referrer information is sent with requests
   * @default "strict-origin-when-cross-origin"
   */
  referrerPolicy?: string;

  /**
   * Permissions-Policy header value
   * Controls which browser features can be used
   * @default "geolocation=(), microphone=(), camera=()"
   */
  permissionsPolicy?: string;

  /**
   * HTTP Strict Transport Security (HSTS) configuration
   * Forces HTTPS connections for the specified duration
   */
  hsts?: {
    /**
     * Time in seconds to enforce HTTPS
     * @default 31536000 (1 year)
     */
    maxAge?: number;

    /**
     * Include all subdomains in HSTS policy
     * @default true
     */
    includeSubDomains?: boolean;

    /**
     * Submit site to browser HSTS preload list
     * @default false
     */
    preload?: boolean;
  };

  /**
   * X-Content-Type-Options: nosniff
   * Prevents MIME type sniffing
   * @default true
   */
  noSniff?: boolean;

  /**
   * X-XSS-Protection header
   * Enables browser XSS filtering
   * @default true
   */
  xssProtection?: boolean;

  /**
   * X-Frame-Options header
   * Prevents clickjacking attacks
   * - "DENY": No framing allowed
   * - "SAMEORIGIN": Only allow framing from same origin
   * - Custom value for specific origins
   * @default "DENY"
   */
  frameOptions?: "DENY" | "SAMEORIGIN" | string;

  /**
   * Cross-Origin-Embedder-Policy header
   * Controls loading of cross-origin resources
   * @default "require-corp"
   */
  crossOriginEmbedderPolicy?: string;

  /**
   * Cross-Origin-Opener-Policy header
   * Isolates browsing context from cross-origin windows
   * @default "same-origin"
   */
  crossOriginOpenerPolicy?: string;

  /**
   * Cross-Origin-Resource-Policy header
   * Controls sharing of resources across origins
   * @default "same-origin"
   */
  crossOriginResourcePolicy?: string;
}

/**
 * Creates a comprehensive security headers middleware.
 *
 * This middleware sets various HTTP security headers to protect against common web vulnerabilities:
 * - XSS attacks (Content Security Policy, X-XSS-Protection)
 * - Clickjacking (X-Frame-Options)
 * - MIME type sniffing (X-Content-Type-Options)
 * - Information leakage (Referrer-Policy)
 * - HTTPS enforcement (HSTS)
 * - Feature policy restrictions (Permissions-Policy)
 *
 * @param options - Configuration options for security headers
 * @returns A middleware function that sets security headers
 *
 * @example
 * ```typescript
 * import { createSecurityHeadersMiddleware } from "reiatsu";
 *
 * // Use default secure settings
 * app.use(createSecurityHeadersMiddleware());
 *
 * // Custom configuration
 * app.use(createSecurityHeadersMiddleware({
 *   contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.example.com",
 *   hsts: {
 *     maxAge: 63072000,      // 2 years
 *     includeSubDomains: true,
 *     preload: true
 *   },
 *   frameOptions: "SAMEORIGIN",
 *   permissionsPolicy: "geolocation=(), camera=()"
 * }));
 *
 * // Disable specific headers
 * app.use(createSecurityHeadersMiddleware({
 *   contentSecurityPolicy: false,  // Disable CSP
 *   xssProtection: false            // Disable X-XSS-Protection
 * }));
 * ```
 *
 * @remarks
 * - HSTS is only set for HTTPS connections
 * - CSP can break functionality if too restrictive - test thoroughly
 * - For production, consider enabling HSTS preload
 * - Some headers may not be supported by older browsers
 */
export const createSecurityHeadersMiddleware = (
  options: SecurityHeadersOptions = {}
): Middleware => {
  const config: Required<SecurityHeadersOptions> = {
    contentSecurityPolicy:
      options.contentSecurityPolicy !== undefined
        ? options.contentSecurityPolicy
        : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
    referrerPolicy: options.referrerPolicy || "strict-origin-when-cross-origin",
    permissionsPolicy:
      options.permissionsPolicy || "geolocation=(), microphone=(), camera=()",
    hsts: {
      maxAge: options.hsts?.maxAge ?? 31536000,
      includeSubDomains: options.hsts?.includeSubDomains ?? true,
      preload: options.hsts?.preload ?? false,
    },
    noSniff: options.noSniff ?? true,
    xssProtection: options.xssProtection ?? true,
    frameOptions: options.frameOptions || "DENY",
    crossOriginEmbedderPolicy:
      options.crossOriginEmbedderPolicy || "require-corp",
    crossOriginOpenerPolicy: options.crossOriginOpenerPolicy || "same-origin",
    crossOriginResourcePolicy:
      options.crossOriginResourcePolicy || "same-origin",
  };

  return async (ctx, next) => {
    // Content Security Policy
    if (config.contentSecurityPolicy) {
      const csp =
        typeof config.contentSecurityPolicy === "string"
          ? config.contentSecurityPolicy
          : "default-src 'self'";
      ctx.res.setHeader("Content-Security-Policy", csp);
    }

    // Referrer Policy
    if (config.referrerPolicy) {
      ctx.res.setHeader("Referrer-Policy", config.referrerPolicy);
    }

    // Permissions Policy
    if (config.permissionsPolicy) {
      ctx.res.setHeader("Permissions-Policy", config.permissionsPolicy);
    }

    // X-Content-Type-Options
    if (config.noSniff) {
      ctx.res.setHeader("X-Content-Type-Options", "nosniff");
    }

    // X-Frame-Options
    if (config.frameOptions) {
      ctx.res.setHeader("X-Frame-Options", config.frameOptions);
    }

    // X-XSS-Protection
    if (config.xssProtection) {
      ctx.res.setHeader("X-XSS-Protection", "1; mode=block");
    }

    // HSTS (only for HTTPS)
    if (ctx.protocol === "https") {
      const { maxAge, includeSubDomains, preload } = config.hsts;
      let hstsValue = `max-age=${maxAge}`;
      if (includeSubDomains) hstsValue += "; includeSubDomains";
      if (preload) hstsValue += "; preload";
      ctx.res.setHeader("Strict-Transport-Security", hstsValue);
    }

    // Cross-Origin headers
    if (config.crossOriginEmbedderPolicy) {
      ctx.res.setHeader(
        "Cross-Origin-Embedder-Policy",
        config.crossOriginEmbedderPolicy
      );
    }

    if (config.crossOriginOpenerPolicy) {
      ctx.res.setHeader(
        "Cross-Origin-Opener-Policy",
        config.crossOriginOpenerPolicy
      );
    }

    if (config.crossOriginResourcePolicy) {
      ctx.res.setHeader(
        "Cross-Origin-Resource-Policy",
        config.crossOriginResourcePolicy
      );
    }

    await next();
  };
};

/**
 * Convenience middleware with default secure settings
 *
 * @example
 * ```typescript
 * import { securityHeadersMiddleware } from "reiatsu";
 *
 * app.use(securityHeadersMiddleware);
 * ```
 */
export const securityHeadersMiddleware: Middleware =
  createSecurityHeadersMiddleware();
