import { IncomingMessage, ServerResponse } from "http";
import { parse as parseUrl } from "url";
import type { TLSSocket } from "tls";
import { parseCookie } from "../utils/parseCookie";
import { readFileSync, statSync } from "fs";
import { extname, basename } from "path";
import { render, renderFile } from "./template-engine";
import { QueryParams } from "../types/http";

/**
 * Represents the context for a single HTTP request/response cycle.
 *
 * Provides convenient helpers for accessing request data (headers, cookies, query, body, etc.)
 * and for sending responses (status, body, content type, cookies, redirects, downloads, rendering).
 *
 * @typeParam TParams - The type of route parameters, defaults to an object with string values.
 *
 * @property {boolean} isAuthenticated - Indicates if the request is authenticated.
 * @property {IncomingMessage} req - The raw Node.js HTTP request object.
 * @property {ServerResponse} res - The raw Node.js HTTP response object.
 * @property {TParams} params - Route parameters extracted from the URL.
 * @property {QueryParams} [query] - Query string parameters.
 * @property {any} [body] - Parsed request body.
 *
 * @method get - Retrieves a request header value by name.
 * @method header - Alias for `get`.
 * @method hasHeader - Checks if a request header is present.
 * @method is - Checks if the request Content-Type matches a given type.
 * @method ip - Returns the remote IP address.
 * @method protocol - Returns the protocol ("http" or "https").
 * @method secure - Returns true if the protocol is "https".
 * @method hostname - Returns the hostname from the request.
 * @method subdomains - Returns an array of subdomains.
 * @method cookies - Returns parsed cookies as an object.
 * @method path - Returns the request path.
 * @method originalUrl - Returns the original request URL.
 * @method method - Returns the HTTP method.
 *
 * @method status - Sets the HTTP response status code.
 * @method send - Sends a raw response body with a specified content type.
 * @method text - Sends a plain text response.
 * @method html - Sends an HTML response.
 * @method xml - Sends an XML response.
 * @method json - Sends a JSON response.
 * @method redirect - Redirects to a different URL.
 * @method cookie - Sets a cookie in the response.
 * @method download - Sends a file as a download.
 * @method render - Renders a template string with data and sends as HTML.
 * @method renderFile - Renders a template file with data and sends as HTML.
 */
export class Context<TParams extends Record<string, string> = {}> {
  isAuthenticated: boolean;

  constructor(
    public req: IncomingMessage,
    public res: ServerResponse,
    public params: TParams,
    public query?: QueryParams,
    public body?: any
  ) {
    this.isAuthenticated = false;
  }

  // --- Request Helpers ---

  get(name: string): string | undefined {
    const value = this.req.headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  }

  header(name: string): string | undefined {
    return this.get(name);
  }

  hasHeader(name: string): boolean {
    return this.get(name) !== undefined;
  }

  is(type: string): boolean {
    const contentType = this.get("content-type") || "";
    return contentType.includes(type);
  }

  get ip(): string {
    return this.req.socket.remoteAddress || "";
  }

  get protocol(): string {
    const socket = this.req.socket as TLSSocket;
    return socket.encrypted ? "https" : "http";
  }

  get secure(): boolean {
    return this.protocol === "https";
  }

  get hostname(): string {
    return this.req.headers.host?.split(":")[0] || "";
  }

  get subdomains(): string[] {
    return this.hostname.split(".").slice(0, -2);
  }

  get cookies(): Record<string, string> {
    const rawCookies = parseCookie(this.req.headers.cookie || "");
    return Object.fromEntries(
      Object.entries(rawCookies).map(([k, v]) => [k, v || ""])
    );
  }

  get path(): string {
    const parsedUrl = parseUrl(this.req.url || "", true);
    return parsedUrl.pathname || "";
  }

  get originalUrl(): string {
    return this.req.url || "";
  }

  get method(): string {
    return this.req.method?.toUpperCase() || "GET";
  }

  // --- Response Helpers ---

  status(code: number): this {
    this.res.statusCode = code;
    return this;
  }

  send(body: any, type = "application/octet-stream") {
    this.res.setHeader("Content-Type", type);
    this.res.end(body);
  }

  text(body: string) {
    this.send(body, "text/plain; charset=utf-8");
  }

  html(body: string) {
    this.send(body, "text/html; charset=utf-8");
  }

  xml(body: string) {
    this.send(body, "application/xml; charset=utf-8");
  }

  json(data: any) {
    this.res.setHeader("Content-Type", "application/json");
    this.res.end(JSON.stringify(data));
  }

  redirect(url: string, status = 302) {
    this.res.writeHead(status, { Location: url });
    this.res.end();
  }

  cookie(
    name: string,
    value: string,
    options: {
      path?: string;
      maxAge?: number;
      domain?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "Strict" | "Lax" | "None";
    } = {}
  ) {
    const opts = [
      `Path=${options.path ?? "/"}`,
      options.maxAge != null ? `Max-Age=${options.maxAge}` : null,
      options.domain ? `Domain=${options.domain}` : null,
      options.secure ? `Secure` : null,
      options.httpOnly ? `HttpOnly` : null,
      options.sameSite ? `SameSite=${options.sameSite}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    this.res.setHeader(
      "Set-Cookie",
      Array.isArray(this.res.getHeader("Set-Cookie"))
        ? [
            ...(this.res.getHeader("Set-Cookie") as string[]),
            `${name}=${encodeURIComponent(value)}; ${opts}`,
          ]
        : [`${name}=${encodeURIComponent(value)}; ${opts}`]
    );
  }

  download(filePath: string, filename?: string) {
    const stat = statSync(filePath);
    const name = filename || basename(filePath);
    this.res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${name}\"`
    );
    this.res.setHeader("Content-Length", stat.size);
    const ext = extname(filePath).slice(1);
    this.res.setHeader(
      "Content-Type",
      {
        js: "application/javascript",
        json: "application/json",
        txt: "text/plain",
        html: "text/html",
        pdf: "application/pdf",
      }[ext] || "application/octet-stream"
    );
    this.res.statusCode = this.res.statusCode || 200;
    this.res.end(readFileSync(filePath));
  }

  render(templateStr: string, data: Record<string, any> = {}) {
    const html = render(templateStr, data);
    this.html(html);
  }

  renderFile(filePath: string, data: Record<string, any> = {}) {
    const html = renderFile(filePath, data);
    this.html(html);
  }
}

/**
 * Creates a new Context instance for an incoming HTTP request.
 *
 * @param req The Node.js IncomingMessage object.
 * @param res The Node.js ServerResponse object.
 * @param query Parsed query parameters from the request URL.
 * @returns A new Context instance with all request/response helpers initialized.
 */
export function createContext<TParams extends Record<string, string> = {}>(
  req: IncomingMessage,
  res: ServerResponse,
  query: QueryParams,
  params: TParams = {} as TParams,
  body?: any
): Context<TParams> {
  return new Context<TParams>(req, res, params, query, body);
}
