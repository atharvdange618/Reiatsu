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
 * Type-safe Router class that provides compile-time parameter inference
 * for route handlers based on the route pattern.
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
   * Compiles a route pattern into a regex with named capture groups
   * Supports:
   * - :param - basic parameters
   * - :param(regex) - parameters with regex constraints
   * - * - wildcard matching (captures remaining path)
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
   * Attempts to match the incoming method + URL to a route in our route table.
   * Supports route params like /user/:id and extracts them into `params`.
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
