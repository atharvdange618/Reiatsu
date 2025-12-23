import { Context } from "../core/context";
import { Middleware, CacheEntry } from "../types/http";

const cacheStore = new Map<string, CacheEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      cacheStore.delete(key);
    }
  }
}, 30000);

/**
 * Middleware to cache HTTP responses for a specified duration.
 *
 * Stores responses in an in-memory cache and serves cached responses
 * for subsequent requests with the same method and URL, as long as the
 * cache entry is still valid (not expired).
 *
 * @param ttlSeconds - Time-to-live for the cache entry in seconds. Defaults to 60 seconds.
 * @returns A middleware function that handles caching logic.
 *
 * @example
 * app.use(cache(120)); // Cache responses for 2 minutes
 */
export function cache(ttlSeconds: number = 60): Middleware {
  return async (ctx: Context, next) => {
    const key = `${ctx.req.method}:${ctx.req.url}`;
    const now = Date.now();

    const entry = cacheStore.get(key);
    if (entry && now - entry.timestamp < entry.ttl) {
      ctx.res.writeHead(entry.statusCode, {
        ...entry.headers,
        "Cache-Control": `public, max-age=${Math.floor(entry.ttl / 1000)}`,
      });
      ctx.res.end(entry.body);
      return;
    }

    const chunks: Buffer[] = [];
    const originalWrite = ctx.res.write.bind(ctx.res);
    const originalEnd = ctx.res.end.bind(ctx.res);

    ctx.res.write = (chunk: any) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return originalWrite(chunk);
    };
    ctx.res.end = (chunk?: any) => {
      if (chunk)
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      const body = Buffer.concat(chunks);
      cacheStore.set(key, {
        timestamp: now,
        ttl: ttlSeconds * 1000,
        statusCode: ctx.res.statusCode,
        headers: ctx.res.getHeaders() as Record<string, string>,
        body,
      });
      ctx.res.setHeader("Cache-Control", `public, max-age=${ttlSeconds}`);
      return originalEnd(chunk);
    };

    await next();
  };
}
