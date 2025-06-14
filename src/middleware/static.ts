import fs from "fs/promises";
import path from "path";
import { Middleware } from "../types/http";
import { getMimeType } from "../utils/mime";
import { Context } from "../core/context";

export function serveStatic(baseDir: string): Middleware {
  return async (ctx: Context, next) => {
    // Only process requests that start with /static/
    if (!ctx.req.url?.startsWith("/static/")) {
      await next();
      return;
    }

    const { url = "" } = ctx.req;

    // Extract path after /static/ prefix
    const unsafePath = decodeURIComponent(url.replace(/^\/static\//, ""));
    const resolvedPath = path.resolve(process.cwd(), baseDir, unsafePath);
    const safeBase = path.resolve(process.cwd(), baseDir);

    // 🛡 Prevent path traversal: ensure the resolved path starts with the base dir
    if (!resolvedPath.startsWith(safeBase)) {
      ctx.res.writeHead(403, { "Content-Type": "text/plain" });
      ctx.res.end("Forbidden");
      return;
    }

    try {
      const data = await fs.readFile(resolvedPath);
      const ext = path.extname(resolvedPath).toLowerCase();

      ctx.res.writeHead(200, { "Content-Type": getMimeType(resolvedPath) });
      ctx.res.end(data);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // File not found, proceed to next middleware
        await next();
      } else {
        console.error("Static file error:", err);
        ctx.res.writeHead(500, { "Content-Type": "text/plain" });
        ctx.res.end("Internal Server Error");
      }
    }
  };
}
