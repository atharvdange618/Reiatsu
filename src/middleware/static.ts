import fs from "fs/promises";
import path from "path";
import { Context, Middleware } from "../types/http";

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

export function serveStatic(baseDir: string): Middleware {
  return async (ctx: Context, next) => {
    if (!ctx.req.url?.startsWith("/static/")) {
      await next();
      return;
    }

    const { url = "" } = ctx.req;

    const unsafePath = decodeURIComponent(url.replace(/^\/static/, ""));
    const resolvedPath = path.resolve(process.cwd(), baseDir, `.${unsafePath}`);
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
      const contentType = mimeTypes[ext] || "application/octet-stream";

      ctx.res.writeHead(200, { "Content-Type": contentType });
      ctx.res.end(data);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        await next();
      } else {
        ctx.res.writeHead(500, { "Content-Type": "text/plain" });
        ctx.res.end("Internal Server Error");
      }
    }
  };
}
