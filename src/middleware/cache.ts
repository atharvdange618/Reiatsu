import { Middleware, Context, CacheEntry } from "../types/http";

const cacheStore = new Map<string, CacheEntry>();

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
