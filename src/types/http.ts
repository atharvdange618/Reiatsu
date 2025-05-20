import { IncomingMessage, ServerResponse } from "http";

/**
 * Type for extracted route parameters.
 */
export type RouteParams = Record<string, string>;

/**
 * A shared context object passed to all route handlers.
 * Contains:
 * - `req`: the raw HTTP request
 * - `res`: the raw HTTP response
 * - `params`: dynamic route parameters
 */
export interface Context {
  req: IncomingMessage;
  res: ServerResponse;
  params: RouteParams;
  body?: any;
}

/**
 * Function signature for route handlers.
 * Accepts a Context object, returns void.
 */
export type Handler = (ctx: Context) => void;

/**
 * Function signature for route middlewares.
 * Accepts a Context object and next, returns void.
 */
export type Middleware = (ctx: Context, next: () => void) => void;

/**
 * Represents a route definition.
 * Contains:
 * - `method`: HTTP verb (GET, POST, etc.)
 * - `path`: URL pattern (e.g., /user/:id)
 * - `handler`: function to run when the route matches
 */
export interface Route {
  method: string;
  path: string;
  handler: Handler;
  middlewares?: Middleware[];
}
