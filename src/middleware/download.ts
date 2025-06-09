import { createReadStream, existsSync, statSync } from "fs";
import { basename, extname } from "path";
import { InternalServerError, NotFoundError } from "../errors/AppError";
import { mimeTypes } from "../utils/mime";
import { Context } from "../core/context";

/**
 * Middleware that adds a `download` helper method to the context.
 *
 * The `ctx.download(filePath, filename?)` method allows controllers to easily send files
 * as downloadable attachments to the client. It sets appropriate headers, streams the file,
 * and handles errors if the file does not exist or streaming fails.
 *
 * @returns An async middleware function that augments the context with a `download` method.
 *
 * @example
 * // Usage in a route
 * router.get('/download/:file', async (ctx) => {
 *   await ctx.download(`/files/${ctx.params.file}`);
 * });
 */
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
