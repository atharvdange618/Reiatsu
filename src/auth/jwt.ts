import { Context } from "../core/context";
import type { Middleware } from "../types/http";
import type { JWTAuthOptions, UserPayload } from "./types";
import { extractTokenFromHeader, verifyHMAC } from "./utils";
import {
  createHmac as nodeCreateHmac,
  timingSafeEqual as nodeTimingSafeEqual,
} from "crypto";

/**
 * Creates a middleware function for handling JWT authentication in HTTP requests.
 *
 * This middleware extracts a JWT from the specified HTTP header, verifies or decodes it,
 * and attaches the decoded payload to the context. It supports configurable options such as
 * the secret key, algorithm, header name, authentication scheme, and error handling.
 *
 * @param options - Configuration options for JWT authentication.
 * @returns A middleware function that processes JWT authentication for incoming requests.
 *
 * @remarks
 * - If `decodeOnly` is true, the JWT is only decoded and not verified.
 * - If `required` is true, requests without a valid JWT will be rejected with a 401 status.
 * - If `onError` is provided, it will be called on authentication errors.
 *
 * @example
 * ```typescript
 * app.use(jwtMiddleware({ secret: "mysecret" }));
 * ```
 */
export function jwtMiddleware(options: JWTAuthOptions): Middleware {
  /**
   * Options for configuring JWT authentication.
   *
   * @property secret - The secret key used to sign and verify JWT tokens.
   * @property algorithm - The algorithm used for signing the JWT. Defaults to "HS256".
   * @property header - The HTTP header from which to extract the JWT. Defaults to "authorization".
   * @property scheme - The authentication scheme expected in the header. Defaults to "Bearer".
   * @property decodeOnly - If true, only decodes the JWT without verifying the signature. Defaults to false.
   * @property required - If true, authentication is required and requests without a valid JWT will be rejected. Defaults to true.
   * @property onError - Optional error handler function to be called on authentication errors.
   */
  const {
    secret,
    algorithm = "HS256",
    header = "authorization",
    scheme = "Bearer",
    decodeOnly = false,
    required = true,
    onError,
  } = options;

  return async (ctx: Context, next) => {
    try {
      const headerVal = ctx.header(header);
      const token = extractTokenFromHeader(headerVal, scheme);

      if (!token) {
        if (required) throw new Error("Token missing");
        ctx.isAuthenticated = false;
        return await next();
      }

      let payload: UserPayload;
      if (decodeOnly) {
        const [, payloadB64] = token.split(".");
        payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
      } else {
        if (algorithm !== "HS256") {
          throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
        payload = verifyHMAC(token, secret);
      }

      ctx.user = payload;
      ctx.isAuthenticated = true;

      await next();
    } catch (err) {
      if (onError) return onError(err as Error, ctx);
      if (required) {
        ctx.status(401).json({ error: "Unauthorized" });
      } else {
        ctx.isAuthenticated = false;
        await next();
      }
    }
  };
}

/**
 * Signs a JSON Web Token (JWT) with the given payload and secret.
 *
 * @param payload - The payload to include in the JWT. Should be a plain object.
 * @param secret - The secret key used to sign the JWT.
 * @param expiresIn - Optional. The expiration time for the token (e.g., "1h", "30m"). Defaults to "1h".
 * @returns The signed JWT as a string.
 *
 * @remarks
 * The function uses the HS256 algorithm to sign the token. The `iat` (issued at) and `exp` (expiration) claims
 * are automatically added to the payload based on the current time and the `expiresIn` parameter.
 */
export function signJWT(
  payload: Record<string, any>,
  secret: string,
  expiresIn = "1h"
): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + parseExpiry(expiresIn);

  const data = {
    ...payload,
    iat,
    exp,
  };

  const base64Header = base64UrlEncode(JSON.stringify(header));
  const base64Payload = base64UrlEncode(JSON.stringify(data));
  const signature = hmacSha256Base64Url(
    `${base64Header}.${base64Payload}`,
    secret
  );

  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Decodes and verifies a JSON Web Token (JWT) using the provided secret.
 *
 * This function splits the JWT into its header, payload, and signature components,
 * verifies the signature using HMAC SHA-256 and the provided secret, and checks
 * the token's expiration (if present). If the token is valid and not expired,
 * it returns the decoded payload as an object. Otherwise, it returns `null`.
 *
 * @param token - The JWT string to decode and verify.
 * @param secret - The secret key used to verify the token's signature.
 * @returns The decoded payload as a record if the token is valid, or `null` if invalid or expired.
 */
export function decodeJWT(
  token: string,
  secret: string
): Record<string, any> | null {
  const [headerB64, payloadB64, signature] = token.split(".");
  if (!headerB64 || !payloadB64 || !signature) return null;

  const expectedSig = hmacSha256Base64Url(`${headerB64}.${payloadB64}`, secret);
  if (!safeEqual(signature, expectedSig)) return null;

  const payload = JSON.parse(base64UrlDecode(payloadB64));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) return null;

  return payload;
}

// --- Internal Utility Functions ---

/**
 * Parses a string representing a time duration (e.g., "10m", "2h") and returns the equivalent number of seconds.
 *
 * @param exp - The expiration string in the format of a number followed by a unit ('s' for seconds, 'm' for minutes, 'h' for hours, 'd' for days).
 * @returns The duration in seconds.
 * @throws {Error} If the input format is invalid.
 */
function parseExpiry(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error("Invalid expiresIn format");

  const [, amountStr, unit] = match;
  const amount = parseInt(amountStr, 10);

  const multipliers = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return amount * multipliers[unit as keyof typeof multipliers];
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4 !== 0) str += "=";
  return Buffer.from(str, "base64").toString("utf8");
}

function hmacSha256Base64Url(data: string, secret: string): string {
  return nodeCreateHmac("sha256", secret).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const abuf = Buffer.from(a);
  const bbuf = Buffer.from(b);
  if (abuf.length !== bbuf.length) return false;
  return nodeTimingSafeEqual(abuf, bbuf);
}
