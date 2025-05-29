import { IncomingMessage } from "http";
import { FileUploadOptions, UploadedFile } from "../types/http";
import { bufferRequest } from "../utils/bufferRequest";
import { parseMultipartFormData } from "../utils/parseMultipartFormData";
import { saveFileToDisk } from "../utils/saveFileToDisk";
import { mimeTypes as defaultMimeTypes } from "../utils/mime";

export function uploadMiddleware(
  options: FileUploadOptions = {
    dest: "uploads",
    maxFileSize: 20 * 1024 * 1024,
    mimeTypes: defaultMimeTypes,
  }
) {
  const dest = options.dest || "uploads";
  const maxFileSize = options.maxFileSize;
  const allowedMimeTypes = options.mimeTypes
    ? Object.values(options.mimeTypes)
    : undefined;

  return async (ctx: any, next: Function) => {
    const req: IncomingMessage = ctx.req;
    const contentType = req.headers["content-type"] || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return next();
    }

    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) return next();
    const boundary = boundaryMatch[1];

    const buffer = await bufferRequest(req);
    const parts = parseMultipartFormData(buffer, boundary);
    ctx.files = [];
    ctx.body = ctx.body || {};

    for (const part of parts) {
      if (part.filename) {
        try {
          const saved = saveFileToDisk({
            dest,
            originalname: part.filename,
            data: part.data,
            mimetype: part.contentType || "application/octet-stream",
            maxFileSize,
            allowedMimeTypes,
          });

          ctx.files.push({
            fieldname: part.name,
            originalname: part.filename,
            encoding: "7bit",
            mimetype: part.contentType || "application/octet-stream",
            size: part.data.length,
            filename: saved.filename,
            path: saved.path,
          } as UploadedFile);
        } catch (err: any) {
          ctx.status(400).json({ error: err.message });
          return;
        }
      } else if (part.name) {
        ctx.body[part.name] = part.data.toString().trim();
      }
    }

    await next();
  };
}
