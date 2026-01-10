import { createGzip, createBrotliCompress } from "zlib";
import { Middleware } from "../types/http";

/**
 * Options for compression middleware
 */
export interface CompressionOptions {
  /**
   * Minimum response size in bytes to trigger compression
   * Responses smaller than this will not be compressed
   * @default 1024 (1KB)
   */
  threshold?: number;

  /**
   * Compression level (0-9)
   * 0 = no compression, 9 = maximum compression
   * @default 6
   */
  level?: number;

  /**
   * Prefer Brotli compression over gzip when available
   * @default true
   */
  preferBrotli?: boolean;

  /**
   * Filter function to determine if a response should be compressed
   * Return true to compress, false to skip
   * @param contentType - The Content-Type header of the response
   * @returns true to compress, false to skip
   */
  filter?: (contentType: string) => boolean;
}

/**
 * Default filter function - compresses text-based content types
 */
const defaultFilter = (contentType: string): boolean => {
  return (
    contentType.startsWith("text/") ||
    contentType.includes("application/json") ||
    contentType.includes("application/javascript") ||
    contentType.includes("application/xml") ||
    contentType.includes("+xml") ||
    contentType.includes("+json")
  );
};

/**
 * Creates a compression middleware that automatically compresses responses using gzip or Brotli.
 *
 * The middleware intercepts response data and compresses it if:
 * - The client supports compression (via Accept-Encoding header)
 * - The response size exceeds the threshold
 * - The content type is compressible (text, JSON, etc.)
 *
 * @param options - Compression configuration options
 * @returns A middleware function that handles response compression
 *
 * @example
 * ```typescript
 * import { createCompressionMiddleware } from "reiatsu";
 *
 * // Use default settings
 * app.use(createCompressionMiddleware());
 *
 * // Custom configuration
 * app.use(createCompressionMiddleware({
 *   threshold: 2048,      // Only compress responses > 2KB
 *   level: 9,             // Maximum compression
 *   preferBrotli: true,   // Use Brotli when available
 *   filter: (type) => type.startsWith('text/') // Only compress text
 * }));
 * ```
 *
 * @remarks
 * - Brotli typically provides 15-20% better compression than gzip
 * - Higher compression levels increase CPU usage
 * - Small responses (< 1KB) are usually not worth compressing
 * - Images, videos, and already-compressed formats are automatically skipped
 */
export const createCompressionMiddleware = (
  options: CompressionOptions = {}
): Middleware => {
  const {
    threshold = 1024,
    level = 6,
    preferBrotli = true,
    filter = defaultFilter,
  } = options;

  return async (ctx, next) => {
    const acceptEncoding = ctx.req.headers["accept-encoding"] || "";

    const originalEnd = ctx.res.end.bind(ctx.res);
    const originalWrite = ctx.res.write.bind(ctx.res);
    let chunks: Buffer[] = [];
    let compressionStarted = false;

    ctx.res.write = ((chunk: any, encoding?: any, callback?: any) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      if (typeof encoding === "function") {
        encoding();
      } else if (typeof callback === "function") {
        callback();
      }
      return true;
    }) as any;

    ctx.res.end = ((chunk?: any, encoding?: any, callback?: any) => {
      if (chunk && !compressionStarted) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);

      if (buffer.length < threshold) {
        ctx.res.write = originalWrite;
        ctx.res.end = originalEnd;
        return originalEnd(buffer);
      }

      const contentType = ctx.res.getHeader("content-type") as string;
      if (contentType && !filter(contentType)) {
        ctx.res.write = originalWrite;
        ctx.res.end = originalEnd;
        return originalEnd(buffer);
      }

      if (preferBrotli && acceptEncoding.includes("br")) {
        ctx.res.setHeader("Content-Encoding", "br");
        ctx.res.removeHeader("Content-Length");
        const br = createBrotliCompress();

        compressionStarted = true;
        ctx.res.write = originalWrite;
        ctx.res.end = originalEnd;

        br.pipe(ctx.res);
        br.end(buffer);
      } else if (acceptEncoding.includes("gzip")) {
        ctx.res.setHeader("Content-Encoding", "gzip");
        ctx.res.removeHeader("Content-Length");
        const gzip = createGzip({ level });

        compressionStarted = true;
        ctx.res.write = originalWrite;
        ctx.res.end = originalEnd;

        gzip.pipe(ctx.res);
        gzip.end(buffer);
      } else {
        ctx.res.write = originalWrite;
        ctx.res.end = originalEnd;
        return originalEnd(buffer);
      }
    }) as any;

    await next();
  };
};
