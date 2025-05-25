import { IncomingMessage, ServerResponse } from "http";

/**
 * Type for extracted route parameters.
 */
export type RouteParams = Record<string, string>;

/**
 * Type for extracted query parameters.
 */
export type QueryParams = Record<string, string | string[]>;

/**
 * A shared context object passed to all route handlers.
 * Encapsulates the HTTP request and response, along with useful
 * parsed data and helper methods to simplify handling requests and
 * crafting responses.
 *
 * Properties:
 * - `req`: The original raw HTTP IncomingMessage request object.
 * - `res`: The raw ServerResponse object for sending responses.
 * - `params`: Parsed dynamic route parameters extracted from the URL.
 * - `body`: Parsed request body, typically JSON or form data (optional).
 * - `query`: Parsed URL query parameters (optional).
 * - `requestId`: A unique identifier assigned to each request (optional).
 *
 * Response Helper Methods:
 * - `status(code)`: Sets the HTTP status code and returns the context for chaining.
 * - `json(data)`: Sends a JSON response with the given data.
 * - `send(body, type)`: Sends a raw response body with an optional Content-Type header.
 * - `html(body)`: Sends an HTML response.
 * - `text(body)`: Sends a plain text response.
 * - `xml(body)`: Sends an XML response.
 * - `redirect(url, status)`: Redirects the client to the specified URL with an optional status code (default 302).
 * - `cookie(name, value, options)`: Sets a cookie on the response with optional settings.
 * - `download(filePath, filename)`: Initiates a file download with an optional filename.
 * - `render(template, data)`: Renders a view template with optional data and sends the output.
 * - `renderFile(filePath, data)`: Renders a template file directly with optional data.
 *
 * Request Helper Properties and Methods:
 * - `get(name)`: Retrieves the value of a request header by name.
 * - `header(name)`: Alias for `get`, retrieves header value.
 * - `hasHeader(name)`: Checks if a header is present on the request.
 * - `is(type)`: Checks if the request's Content-Type matches the given MIME type.
 * - `ip`: The client's IP address.
 * - `protocol`: The protocol used for the request (e.g., 'http' or 'https').
 * - `secure`: Boolean indicating if the request was made over HTTPS.
 * - `hostname`: The hostname portion of the URL.
 * - `subdomains`: An array of subdomains parsed from the hostname.
 * - `cookies`: Parsed cookies sent with the request.
 * - `path`: The URL path of the request.
 * - `originalUrl`: The full original URL requested.
 * - `method`: The HTTP method (GET, POST, etc.).
 */
export interface Context {
  req: IncomingMessage;
  res: ServerResponse;
  params: RouteParams;
  body?: any;
  query?: QueryParams;
  requestId?: string;

  // Response Helpers
  status: (code: number) => Context;
  json: (data: unknown) => void;
  send: (body: string | Buffer, type?: string) => void;
  html: (body: string) => void;
  text: (body: string) => void;
  xml: (body: string) => void;
  redirect: (url: string, status?: number) => void;
  cookie: (name: string, value: string, options?: CookieOptions) => void;
  download: (filePath: string, filename?: string) => void;
  render: (template: string, data?: Record<string, any>) => void;
  renderFile: (filePath: string, data?: Record<string, any>) => void;

  // Request Helpers
  get: (name: string) => string | undefined;
  header: (name: string) => string | undefined;
  hasHeader: (name: string) => boolean;
  is: (type: string) => boolean;
  ip: string;
  protocol: string;
  secure: boolean;
  hostname: string;
  subdomains: string[];
  cookies: Record<string, string>;
  path: string;
  originalUrl: string;
  method: string;
}

/**
 * Function signature for route handlers.
 * Accepts a Context object, returns void or Promise<void>.
 */
export type Handler = (ctx: Context) => void | Promise<void>;

/**
 * Function signature for route middlewares.
 * Accepts a Context object and next, returns void or Promise<void>.
 */
export type Middleware = (
  ctx: Context,
  next: () => void | Promise<void>
) => void | Promise<void>;

/**
 * Represents a route definition.
 * Contains:
 * - `method`: HTTP verb (GET, POST, etc.)
 * - `path`: URL pattern (e.g., /user/:id)
 * - `handler`: function to run when the route matches
 * - `middlewares`: optional array of middlewares for this route
 */
export interface Route {
  method: string;
  path: string;
  handler: Handler;
  middlewares?: Middleware[];
}

export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

export interface CookieOptions {
  maxAge?: number; // in seconds
  domain?: string;
  path?: string; // defaults to '/'
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  errorCode?: string;
  details?: any;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

export interface LoggerOptions {
  /**
   * Whether to include request ID in logs
   * @default true
   */
  includeRequestId?: boolean;

  /**
   * Whether to log request body (be careful with sensitive data)
   * @default false
   */
  logBody?: boolean;

  /**
   * Whether to log request headers
   * @default false
   */
  logHeaders?: boolean;

  /**
   * Custom log format function
   */
  formatter?: (logData: LogData) => string;

  /**
   * Whether to colorize output (useful for development)
   * @default true if NODE_ENV !== 'production'
   */
  colorize?: boolean;
}

export interface LogData {
  requestId?: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  body?: any;
  headers?: Record<string, any>;
  timestamp: string;
}

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

export interface CacheEntry {
  timestamp: number;
  ttl: number; // milliseconds
  statusCode: number;
  headers: Record<string, string>;
  body: Buffer | string;
}
