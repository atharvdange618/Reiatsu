import { MultipartPart } from "../types/http";

// Helper to find buffer index of a sub-buffer
function bufferIndexOf(buffer: Buffer, sub: Buffer, start = 0): number {
  for (let i = start; i <= buffer.length - sub.length; i++) {
    let match = true;
    for (let j = 0; j < sub.length; j++) {
      if (buffer[i + j] !== sub[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

/**
 * Parses a multipart/form-data buffer into its constituent parts.
 *
 * @param buffer - The raw Buffer containing the multipart/form-data payload.
 * @param boundary - The boundary string used to separate parts in the multipart data.
 * @returns An array of `MultipartPart` objects, each representing a part of the multipart form data.
 *
 * @remarks
 * This function extracts headers, field names, filenames (if present), content types, and the raw data for each part.
 * It expects the buffer to be formatted according to the multipart/form-data specification.
 *
 * @example
 * ```typescript
 * const parts = parseMultipartFormData(buffer, boundary);
 * parts.forEach(part => {
 *   console.log(part.name, part.filename, part.contentType);
 * });
 * ```
 */
export function parseMultipartFormData(
  buffer: Buffer,
  boundary: string
): MultipartPart[] {
  const parts: MultipartPart[] = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const endingBuf = Buffer.from(`--${boundary}--`);
  let start = bufferIndexOf(buffer, boundaryBuf);
  while (start !== -1) {
    start += boundaryBuf.length;
    // skip CRLF
    if (buffer[start] === 0x0d && buffer[start + 1] === 0x0a) start += 2;
    // Find next boundary
    let end = bufferIndexOf(buffer, boundaryBuf, start);
    if (end === -1) end = bufferIndexOf(buffer, endingBuf, start);
    if (end === -1) break;
    const partBuffer = buffer.slice(start, end);
    // Split headers and body
    const headerEnd = bufferIndexOf(partBuffer, Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) {
      start = end;
      continue;
    }
    const headerBuf = partBuffer.slice(0, headerEnd).toString();
    const bodyBuf = partBuffer.slice(headerEnd + 4);
    const headers = headerBuf.split("\r\n").filter(Boolean);
    const disposition = headers.find((h) =>
      h.startsWith("Content-Disposition")
    );
    if (!disposition) {
      start = end;
      continue;
    }
    const nameMatch = disposition.match(/name="([^"]+)"/);
    if (!nameMatch) {
      start = end;
      continue;
    }
    const name = nameMatch[1];
    const filenameMatch = disposition.match(/filename="([^"]+)"/);
    const filename = filenameMatch?.[1];
    const contentTypeHeader = headers.find((h) => h.startsWith("Content-Type"));
    const contentType = contentTypeHeader?.split(": ")[1];
    parts.push({
      headers,
      name,
      filename,
      contentType,
      data: bodyBuf,
    });
    start = end;
  }
  return parts;
}
