import { IncomingMessage, ServerResponse } from "http";
import { Route, Middleware, Handler, HTTPMethod } from "../types/http";
import { runMiddlewares } from "./middleware";
import { createContext } from "../utils/context";

interface CompiledRoute<Path extends string = string> {
  method: HTTPMethod;
  path: Path;
  handler: Handler<Path>;
  middlewares?: Middleware[];
  regex: RegExp;
  paramNames: string[];
  hasWildcard: boolean;
}

/**
 * Type-safe Router class that provides compile-time parameter inference
 * for route handlers based on the route pattern.
 */
export class Router {
  private globalMiddlewares: Middleware[] = [];
  private routes: CompiledRoute<any>[] = [];

  /**
   * Add a global middleware that runs on all routes
   */
  use(middleware: Middleware): void {
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

    const ESCAPE = /[.*+?^${}()|\[\]\\]/g;

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
        if (name === "date" && rawConstraint === "\\d{4}-\\d{2}-\\d{2}") {
          constraint = "(?:\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01]))";
        }

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
  private matchRoute(
    method: string,
    url: string
  ): { route: CompiledRoute<any>; params: Record<string, string> } | null {
    const pathOnly = url.split("?")[0];
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const m = route.regex.exec(pathOnly);
      if (!m) continue;
      const groups = m.groups || {};
      return { route, params: groups };
    }
    return null;
  }

  /**
   * Main request handler with better type safety
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

    const ctx = createContext(req, res, query);

    try {
      await runMiddlewares(ctx, this.globalMiddlewares, async () => {
        const match = this.matchRoute(req.method || "", req.url || "");
        if (!match) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Route Not Found");
          return;
        }

        ctx.params = match.params;

        await runMiddlewares(ctx, match.route.middlewares || [], async () => {
          await match.route.handler(ctx);
        });
      });
    } catch (err) {
      console.error("Router error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    }
  }

  /**
   * Private method to register a route with enhanced type safety
   */
  private addRoute<Path extends string>(
    method: HTTPMethod,
    path: Path,
    ...handlers: [...middlewares: Middleware[], handler: Handler<Path>]
  ): void {
    if (handlers.length === 0) {
      throw new Error("At least one handler must be provided");
    }

    const handler = handlers.pop() as Handler<Path>;
    const middlewares = handlers as Middleware[];

    const compiled = this.compileRoute(path);
    const route: CompiledRoute<Path> = {
      method,
      path,
      handler,
      middlewares,
      regex: compiled.regex,
      paramNames: compiled.paramNames,
      hasWildcard: compiled.hasWildcard,
    };

    this.routes.push(route);
  }

  get<Path extends string>(
    path: Path,
    ...handlers: [...middlewares: Middleware[], handler: Handler<Path>]
  ): void {
    this.addRoute("GET", path, ...handlers);
  }

  post<Path extends string>(
    path: Path,
    ...handlers: [...middlewares: Middleware[], handler: Handler<Path>]
  ): void {
    this.addRoute("POST", path, ...handlers);
  }

  put<Path extends string>(
    path: Path,
    ...handlers: [...middlewares: Middleware[], handler: Handler<Path>]
  ): void {
    this.addRoute("PUT", path, ...handlers);
  }

  delete<Path extends string>(
    path: Path,
    ...handlers: [...middlewares: Middleware[], handler: Handler<Path>]
  ): void {
    this.addRoute("DELETE", path, ...handlers);
  }

  patch<Path extends string>(
    path: Path,
    ...handlers: [...middlewares: Middleware[], handler: Handler<Path>]
  ): void {
    this.addRoute("PATCH", path, ...handlers);
  }

  options<Path extends string>(
    path: Path,
    ...handlers: [...middlewares: Middleware[], handler: Handler<Path>]
  ): void {
    this.addRoute("OPTIONS", path, ...handlers);
  }

  head<Path extends string>(
    path: Path,
    ...handlers: [...middlewares: Middleware[], handler: Handler<Path>]
  ): void {
    this.addRoute("HEAD", path, ...handlers);
  }

  /**
   * Get all registered routes
   */
  getRoutes(): CompiledRoute<any>[] {
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
