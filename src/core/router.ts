import { IncomingMessage, ServerResponse } from "http";
import { Route, Context, Middleware, Handler, HTTPMethod } from "../types/http";
import { runMiddlewares } from "./middleware";

const globalMiddlewares: Middleware[] = [];
const routes: Route[] = [];

export const use = (middleware: Middleware) => {
  globalMiddlewares.push(middleware);
};

/**
 * Attempts to match the incoming method + URL to a route in our route table.
 * Supports route params like /user/:id and extracts them into `params`.
 */
function matchRoute(
  method: string,
  url: string
): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    // Check if HTTP method matches (GET, POST, etc.)
    if (route.method !== method) continue;

    // Split route path and incoming URL into parts (e.g., "/user/:id" → ['user', ':id'])
    const routeParts = route.path.split("/").filter(Boolean);
    const urlParts = url.split("/").filter(Boolean);

    // If number of segments don't match, skip this route
    if (routeParts.length !== urlParts.length) continue;

    const params: Record<string, string> = {};

    let matched = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        // It's a param like ":id" → capture it
        const key = routeParts[i].slice(1);
        params[key] = urlParts[i];
      } else if (routeParts[i] !== urlParts[i]) {
        // It's a hardcoded segment and doesn't match → break
        matched = false;
        break;
      }
    }

    if (matched) return { route, params };
  }

  // No route matched
  return null;
}

/**
 * The router interface.
 */
export const router: {
  handle: (req: IncomingMessage, res: ServerResponse) => void;
  routes: Route[];
  [method: string]: any;
} = {
  routes,

  handle(req: IncomingMessage, res: ServerResponse) {
    const match = matchRoute(req.method || "", req.url || "");

    if (!match) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }

    const ctx: Context = {
      req,
      res,
      params: match.params,
    };

    const routeMiddlewares = match.route.middlewares || [];
    const allMiddlewares = [...globalMiddlewares, ...routeMiddlewares];

    runMiddlewares(ctx, allMiddlewares, match.route.handler);
  },
};

const methods: HTTPMethod[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "HEAD",
];

methods.forEach((method) => {
  router[method.toLowerCase()] = (
    path: string,
    ...handlers: (Middleware | Handler)[]
  ) => {
    const handler = handlers.pop() as Handler;
    const middlewares = handlers as Middleware[];

    routes.push({
      method,
      path,
      handler,
      middlewares,
    });
  };
});
