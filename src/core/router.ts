import { IncomingMessage, ServerResponse } from "http";
import { Route, Context, Middleware, Handler, HTTPMethod } from "../types/http";
import { runMiddlewares } from "./middleware";

const globalMiddlewares: Middleware[] = [];
const routes: CompiledRoute[] = [];

interface CompiledRoute extends Route {
  regex: RegExp;
  paramNames: string[];
  hasWildcard: boolean;
}

export const use = (middleware: Middleware) => {
  globalMiddlewares.push(middleware);
};

/**
 * Compiles a route pattern into a regex with named capture groups
 * Supports:
 * - :param - basic parameters
 * - :param(regex) - parameters with regex constraints
 * - * - wildcard matching (captures remaining path)
 */
export function compileRoute(path: string): {
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
    // Wildcard only if it’s the last segment
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
function matchRoute(
  method: string,
  url: string
): { route: CompiledRoute; params: Record<string, string> } | null {
  const pathOnly = url.split("?")[0];
  for (const route of routes) {
    if (route.method !== method) continue;
    const m = route.regex.exec(pathOnly);
    if (!m) continue;
    const groups = m.groups || {};
    return { route, params: groups };
  }
  return null;
}

/**
 * The router interface.
 */
export const router: {
  handle: (req: IncomingMessage, res: ServerResponse) => void;
  routes: CompiledRoute[];
  [method: string]: any;
} = {
  routes,
  async handle(req, res) {
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

    const ctx: Context = { req, res, params: {}, query };
    try {
      await runMiddlewares(ctx, globalMiddlewares, async () => {
        const match = matchRoute(req.method || "", req.url || "");
        if (!match) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Route Not Found");
          return;
        }
        ctx.params = match.params;
        await runMiddlewares(
          ctx,
          match.route.middlewares || [],
          match.route.handler
        );
      });
    } catch (err) {
      console.error("Router error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    }
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

    const compiled = compileRoute(path);
    const route: CompiledRoute = {
      method,
      path,
      handler,
      middlewares,
      regex: compiled.regex,
      paramNames: compiled.paramNames,
      hasWildcard: compiled.hasWildcard,
    };

    routes.push(route);
  };
});
