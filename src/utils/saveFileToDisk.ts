import { writeFileSync, mkdirSync } from "fs";
import { join, extname, basename } from "path";
import { SaveFileOptions } from "../types/http";

export function sanitizeFilename(name: string): string {
  return basename(name).replace(/[^a-zA-Z0-9_.-]/g, "_");
}

/**
 * Saves a file to disk with validation for file size and MIME type.
 *
 * @param options - The options for saving the file.
 * @param options.dest - The destination directory where the file will be saved.
 * @param options.originalname - The original name of the file.
 * @param options.data - The file data as a Buffer.
 * @param options.maxFileSize - (Optional) The maximum allowed file size in bytes.
 * @param options.allowedMimeTypes - (Optional) An array of allowed MIME types.
 * @param options.mimetype - The MIME type of the file.
 * @returns An object containing the generated filename and the full path to the saved file.
 * @throws Will throw an error if the file size exceeds the specified limit or if the MIME type is not allowed.
 */
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
