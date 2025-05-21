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
  const pathOnly = url.split("?")[0];

  for (const route of routes) {
    if (route.method !== method) continue;

    const routeParts = route.path.split("/").filter(Boolean);
    const urlParts = pathOnly.split("/").filter(Boolean);

    const params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const urlPart = urlParts[i];

      if (routePart === "*") {
        return { route, params };
      }

      if (!urlPart) {
        matched = false;
        break;
      }

      if (routePart.startsWith(":")) {
        const key = routePart.slice(1);
        params[key] = urlPart;
      } else if (routePart !== urlPart) {
        matched = false;
        break;
      }
    }

    if (matched && routeParts.length <= urlParts.length) {
      if (
        routeParts[routeParts.length - 1] === "*" ||
        routeParts.length === urlParts.length
      ) {
        return { route, params };
      }
    }
  }

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
    const fullUrl = new URL(req.url || "", `http://${req.headers.host}`);
    const query: Record<string, string | string[]> = {};
    fullUrl.searchParams.forEach((value, key) => {
      if (query[key]) {
        query[key] = Array.isArray(query[key])
          ? [...(query[key] as string[]), value]
          : [query[key] as string, value];
      } else {
        query[key] = value;
      }
    });

    const ctx: Context = {
      req,
      res,
      params: {},
      query,
    };

    const runGlobalMiddlewares = async () => {
      try {
        await runMiddlewares(ctx, globalMiddlewares, async () => {
          // After global middlewares, proceed to route matching
          const match = matchRoute(req.method || "", req.url || "");

          if (!match) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Route Not Found");
            return;
          }

          ctx.params = match.params;

          const routeMiddlewares = match.route.middlewares || [];
          await runMiddlewares(ctx, routeMiddlewares, match.route.handler);
        });
      } catch (err) {
        console.error("Middleware error:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal Server Error");
        }
      }
    };

    runGlobalMiddlewares();
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
