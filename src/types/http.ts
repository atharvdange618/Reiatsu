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
  status?: (code: number) => Context;
  json?: (data: unknown) => void;
  redirect?: (url: string, status?: number) => Promise<void>;
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
