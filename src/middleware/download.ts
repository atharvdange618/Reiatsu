import { createReadStream, existsSync, statSync } from "fs";
import { basename, extname } from "path";
import { Context } from "../types/http";
import { InternalServerError, NotFoundError } from "../errors/AppError";
import { mimeTypes } from "../utils/mime";

export function downloadHelperMiddleware() {
  return async (ctx: Context, next: Function) => {
    ctx.download = (filePath: string, filename?: string) => {
      if (!existsSync(filePath)) {
        throw new NotFoundError(`File not found: ${filePath}`);
      }

      const stat = statSync(filePath);
      const ext = extname(filePath);
      const mime = mimeTypes[ext] || "application/octet-stream";

      const finalName = filename || basename(filePath);

      ctx.res.writeHead(200, {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${finalName}"`,
        "Content-Length": stat.size,
      });

      const stream = createReadStream(filePath);
      stream.pipe(ctx.res);
      stream.on("error", (err) => {
        console.error(`Error streaming file ${filePath}:`, err);
        throw new InternalServerError(`Error streaming file: ${filePath}`);
      });
    };

    await next();
  };
}
