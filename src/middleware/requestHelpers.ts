import { Middleware } from "../types/http";
import { parse as parseCookie } from "cookie";
import { parse as parseUrl } from "url";
import type { TLSSocket } from "tls";

export const requestHelpersMiddleware: Middleware = async (ctx, next) => {
  const { req } = ctx;

  ctx.get = (name: string): string | undefined => {
    const value = req.headers[name.toLowerCase()];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  ctx.header = ctx.get;

  ctx.hasHeader = (name: string): boolean => {
    return ctx.get(name) !== undefined;
  };

  ctx.is = (type: string): boolean => {
    const contentType = ctx.get("content-type") || "";
    return contentType.includes(type);
  };

  ctx.ip = req.socket.remoteAddress || "";

  const socket = req.socket as TLSSocket;
  ctx.protocol = socket.encrypted ? "https" : "http";

  ctx.secure = ctx.protocol === "https";

  ctx.hostname = req.headers.host?.split(":")[0] || "";

  ctx.subdomains = ctx.hostname.split(".").slice(0, -2);

  const rawCookies = parseCookie(req.headers.cookie || "");
  ctx.cookies = Object.fromEntries(
    Object.entries(rawCookies).map(([k, v]) => [k, v || ""])
  );

  const parsedUrl = parseUrl(req.url || "", true);
  ctx.path = parsedUrl.pathname || "";
  ctx.originalUrl = req.url || "";

  ctx.method = req.method?.toUpperCase() || "GET";

  await next();
};
