import { writeFileSync, mkdirSync } from "fs";
import { join, extname, basename } from "path";
import { SaveFileOptions } from "../types/http";


export function sanitizeFilename(name: string): string {
  return basename(name).replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function saveFileToDisk(options: SaveFileOptions): {
  filename: string;
  path: string;
} {
  const { dest, originalname, data, maxFileSize, allowedMimeTypes, mimetype } =
    options;

  if (maxFileSize && data.length > maxFileSize) {
    throw new Error("File size exceeds limit");
  }

  if (allowedMimeTypes && !allowedMimeTypes.includes(mimetype)) {
    throw new Error("Invalid file type");
  }

  mkdirSync(dest, { recursive: true });

  const safeName = sanitizeFilename(originalname);
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${extname(safeName)}`;
  const filePath = join(dest, filename);

  writeFileSync(filePath, data);

  return { filename, path: filePath };
}
