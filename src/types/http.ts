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
 * Contains:
 * - `req`: the raw HTTP request
 * - `res`: the raw HTTP response
 * - `params`: dynamic route parameters
 * - `body`: parsed request body
 * - `query`: parsed query parameters
 * - `requestId`: unique identifier for this request
 * - `status`: helper function to set response status code
 * - `json`: helper function to send JSON response
 * - `redirect`: helper function to redirect to another URL
 */
export interface Context {
  req: IncomingMessage;
  res: ServerResponse;
  params: RouteParams;
  body?: any;
  query?: QueryParams;
  requestId?: string;
  status: (code: number) => Context;
  json: (data: unknown) => void;
  send: (body: string | Buffer, type?: string) => void;
  html: (body: string) => void;
  text: (body: string) => void;
  xml: (body: string) => void;
  redirect: (url: string, status?: number) => void;
  cookie: (name: string, value: string, options?: CookieOptions) => void;
  download: (filePath: string, filename?: string) => void;
  render: (templateName: string, data?: any) => void;
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
