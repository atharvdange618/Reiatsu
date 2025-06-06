import { Context } from "../core/context";
import type { Middleware } from "../types/http";
import type { JWTAuthOptions, UserPayload } from "./types";
import { extractTokenFromHeader, verifyHMAC } from "./utils";
import {
  createHmac as nodeCreateHmac,
  timingSafeEqual as nodeTimingSafeEqual,
} from "crypto";

export function jwtMiddleware(options: JWTAuthOptions): Middleware {
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
