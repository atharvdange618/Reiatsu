import { IncomingMessage, ServerResponse } from "http";
import { Context } from "../types/http";
import type { TLSSocket } from "tls";

export function createContext(
  req: IncomingMessage,
  res: ServerResponse,
  query: Record<string, string | string[]>
): Context {
  const noop = () => {
    throw new Error("Helper not initialized");
  };

  const socket = req.socket as TLSSocket;

  const host = req.headers.host || "";

  const ctx: Context = {
    req,
    res,
    params: {} as any,
    query,
    requestId: undefined,

    // Response helpers
    status: (code: number) => {
      res.statusCode = code;
      return ctx;
    },
    json: (data: unknown) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    },

    send: noop,
    html: noop,
    text: noop,
    xml: noop,
    redirect: noop,
    cookie: noop,
    download: noop,
    render: noop,
    renderFile: noop,

    // Request helpers
    get: noop,
    header: noop,
    hasHeader: noop,
    is: noop,

    ip: req.socket.remoteAddress || "",
    protocol: socket.encrypted ? "https" : "http",
    secure: !!socket.encrypted,
    hostname: host.split(":")[0],
    subdomains: host.split(".").slice(0, -2),

    cookies: Object.fromEntries(
      (req.headers.cookie || "")
        .split(";")
        .map((cookie) => {
          const [key, ...rest] = cookie.split("=");
          return [key.trim(), decodeURIComponent(rest.join("=") || "")];
        })
        .filter(([k]) => k)
    ),

    path: req.url?.split("?")[0] || "",
    originalUrl: req.url || "",
    method: req.method?.toUpperCase() || "GET",
  };

  return ctx;
}
