import { IncomingMessage, ServerResponse } from "http";
import {
  Middleware,
  Handler,
  HTTPMethod,
  CompiledRoute,
  ExtractRouteParams,
} from "../types/http";
import { runMiddlewares } from "./middleware";
import { Context, createContext } from "./context";

/**
 * The `Router` class provides a lightweight HTTP routing system with support for route parameters,
 * middleware, and route-specific handlers. It allows you to define routes for various HTTP methods,
 * attach global and per-route middleware, and handle incoming HTTP requests by matching them to
 * registered routes.
 *
 * ### Features
 * - Register routes for HTTP methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD.
 * - Define route patterns with named parameters (e.g., `/user/:id`), regex constraints (e.g., `/user/:id(\\d+)`), and wildcards (e.g., `/files/*`).
 * - Attach global middleware (runs on all routes) and per-route middleware.
 * - Extracts route parameters and query parameters into the request context.
 * - Handles 404 (route not found) and 500 (internal server error) responses.
 *
 * ### Usage
 * ```typescript
 * const router = new Router();
 * router.use(globalMiddleware);
 * router.get('/user/:id', userMiddleware, async (ctx) => { ... });
 * ```
 *
 * @template Path - The route path string type.
 * @template Context - The context type passed to handlers and middleware.
 *
 * @remarks
 * - Route parameters are extracted and made available in the context.
 * - Middleware functions can be asynchronous and can short-circuit the request.
 * - The router is designed to be used with Node.js HTTP servers.
 */
export class Router {
  private globalMiddlewares: Middleware<any>[] = [];
  private routes: CompiledRoute<string>[] = [];

  /**
   * Add a global middleware that runs on all routes
   */
  use(middleware: Middleware<any>): void {
    this.globalMiddlewares.push(middleware);
  }

  /**
   * Compiles a route path string into a regular expression for matching URLs,
   * extracting parameter names and detecting wildcards.
   *
   * Supports named parameters (e.g., `:id`), optional regex constraints for parameters
   * (e.g., `:id(\\d+)`), and a trailing wildcard segment (`*`) for catch-all routes.
   *
   * @param path - The route path pattern to compile (e.g., `/users/:id(\\d+)/posts/*`).
   * @returns An object containing:
   *   - `regex`: The generated regular expression for matching the route.
   *   - `paramNames`: An array of parameter names extracted from the path.
   *   - `hasWildcard`: A boolean indicating if the route ends with a wildcard segment.
   */
  private compileRoute(path: string): {
    regex: RegExp;
    paramNames: string[];
    hasWildcard: boolean;
  } {
    const paramNames: string[] = [];
    let hasWildcard = false;

    const ESCAPE = /[.*+?^${}()|[\]\\]/g;

    const segments = path
      .split("/")
      .filter((seg, idx) => !(idx === 0 && seg === ""));

    const parts: string[] = segments.map((segment, idx) => {
      // Wildcard only if it's the last segment
      if (segment === "*" && idx === segments.length - 1) {
        hasWildcard = true;
        paramNames.push("wildcard");
        return `(?<wildcard>.*)`;
      }

      let segPattern = "";
      let lastIndex = 0;
      const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)(?:\(([^)]+)\))?/g;
      let match: RegExpExecArray | null;

      // :param or :param(regex)
      while ((match = paramRegex.exec(segment)) !== null) {
        const [full, name, rawConstraint] = match;
        const start = match.index;

        if (start > lastIndex) {
          segPattern += segment.slice(lastIndex, start).replace(ESCAPE, "\\$&");
        }

        let constraint = rawConstraint!;

        paramNames.push(name);
        if (constraint) {
          segPattern += `(?<${name}>${constraint})`;
        } else {
          segPattern += `(?<${name}>[^/]+)`;
        }

        lastIndex = start + full.length;
      }

      if (lastIndex < segment.length) {
        segPattern += segment.slice(lastIndex).replace(ESCAPE, "\\$&");
      }

      if (!segPattern) {
        segPattern = segment.replace(ESCAPE, "\\$&");
      }

      return segPattern;
    });

    const prefix = "^" + (parts.length ? "/" + parts.join("/") : "");
    const suffix = hasWildcard ? "" : "$";
    const regex = new RegExp(prefix + suffix);

    return { regex, paramNames, hasWildcard };
  }

  /**
   * Handles incoming HTTP requests by parsing the URL and query parameters,
   * creating a context, and executing global and route-specific middlewares.
   * If a matching route is found, invokes the corresponding route handler.
   * Responds with a 404 status if no route matches, or a 500 status on errors.
   *
   * @param req - The incoming HTTP request object.
   * @param res - The HTTP server response object.
   * @returns A promise that resolves when the request has been fully handled.
   */
  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const fullUrl = new URL(req.url || "", `http://${req.headers.host}`);
    const query: Record<string, string | string[]> = {};
    fullUrl.searchParams.forEach((v, k) => {
      if (query[k]) {
        query[k] = Array.isArray(query[k])
          ? [...(query[k] as string[]), v]
          : [query[k] as string, v];
      } else {
        query[k] = v;
      }
    });

    const ctx = createContext(req, res, query, {});

    try {
      await runMiddlewares(
        ctx as Context<Record<string, string>>,
        this.globalMiddlewares,
        async (currentCtx) => {
          const match = this.matchRoute(req.method || "", req.url || "");
          if (!match) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Route Not Found");
            return;
          }

          Object.assign(currentCtx.params, match.params);

          await runMiddlewares(
            currentCtx as Context<ExtractRouteParams<typeof match.route.path>>,
            match.route.middlewares || [],
            async (specificRouteCtx) => {
              await (
                match.route.handler as Handler<
                  typeof match.route.path,
                  Context<ExtractRouteParams<typeof match.route.path>>
                >
              )(specificRouteCtx);
            }
          );
        }
      );
    } catch (err) {
      console.error("Router error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    }
  }

  /**
   * Attempts to match a given HTTP method and URL against the registered routes.
   *
   * @param method - The HTTP method (e.g., "GET", "POST") to match.
   * @param url - The full URL to match against the route patterns.
   * @returns An object containing the matched route and extracted parameters if a match is found; otherwise, `undefined`.
   */
  private matchRoute(
    method: string,
    url: string
  ):
    | {
        route: CompiledRoute<string>;
        params: Record<string, string>;
      }
    | undefined {
    const path = new URL(url, "http://localhost").pathname;
    for (const route of this.routes) {
      if (route.method === method) {
        const match = route.regex.exec(path);
        if (match) {
          const params: Record<string, string> = {};
          if (match.groups) {
            for (const name of route.paramNames) {
              if (match.groups[name]) {
                params[name] = match.groups[name];
              }
            }
          }
          return { route: route, params };
        }
      }
    }
    return undefined;
  }

  /**
   * Adds a new route to the router with the specified HTTP method, path, and handlers.
   *
   * @template Path - The type of the route path as a string literal.
   * @param method - The HTTP method for the route (e.g., 'GET', 'POST').
   * @param path - The route path pattern, which may include parameters.
   * @param handlers - An array of middleware functions and a final route handler.
   *                   The last element must be a route handler; preceding elements are treated as middleware.
   * @throws {Error} If no handlers are provided.
   */
  private addRoute<Path extends string>(
    method: HTTPMethod,
    path: Path,
    handlers: (
      | Middleware<any>
      | Handler<Path, Context<ExtractRouteParams<Path>>>
    )[]
  ): void {
    if (handlers.length === 0) {
      throw new Error("At least one handler must be provided");
    }

    const handler = handlers.pop() as Handler<
      Path,
      Context<ExtractRouteParams<Path>>
    >;
    const middlewares = handlers as Middleware<any>[];

    const compiled = this.compileRoute(path);
    const route: CompiledRoute<Path> = {
      method,
      path,
      handler: handler,
      middlewares,
      regex: compiled.regex,
      paramNames: compiled.paramNames,
      hasWildcard: compiled.hasWildcard,
    };

    this.routes.push(route);
  }

  get<P extends string>(
    path: P,
    ...handlers: [
      ...middlewares: Middleware<any>[],
      handler: Handler<P, Context<ExtractRouteParams<P>>>
    ]
  ): void {
    this.addRoute("GET", path, handlers);
  }

  post<P extends string>(
    path: P,
    ...handlers: [
      ...middlewares: Middleware<any>[],
      handler: Handler<P, Context<ExtractRouteParams<P>>>
    ]
  ): void {
    this.addRoute("POST", path, handlers);
  }

  put<P extends string>(
    path: P,
    ...handlers: [
      ...middlewares: Middleware<any>[],
      handler: Handler<P, Context<ExtractRouteParams<P>>>
    ]
  ): void {
    this.addRoute("PUT", path, handlers);
  }

  delete<P extends string>(
    path: P,
    ...handlers: [
      ...middlewares: Middleware<any>[],
      handler: Handler<P, Context<ExtractRouteParams<P>>>
    ]
  ): void {
    this.addRoute("DELETE", path, handlers);
  }

  patch<P extends string>(
    path: P,
    ...handlers: [
      ...middlewares: Middleware<any>[],
      handler: Handler<P, Context<ExtractRouteParams<P>>>
    ]
  ): void {
    this.addRoute("PATCH", path, handlers);
  }

  options<P extends string>(
    path: P,
    ...handlers: [
      ...middlewares: Middleware<any>[],
      handler: Handler<P, Context<ExtractRouteParams<P>>>
    ]
  ): void {
    this.addRoute("OPTIONS", path, handlers);
  }

  head<P extends string>(
    path: P,
    ...handlers: [
      ...middlewares: Middleware<any>[],
      handler: Handler<P, Context<ExtractRouteParams<P>>>
    ]
  ): void {
    this.addRoute("HEAD", path, handlers);
  }

  /**
   * Get all registered routes
   */
  getRoutes(): CompiledRoute<string>[] {
    return [...this.routes];
  }
}

export const router = new Router();

export const use = router.use.bind(router);

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  await router.handle(req, res);
}
