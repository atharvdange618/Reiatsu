import { IncomingMessage } from "http";

/**
 * Buffers the entire body of an incoming HTTP request and returns it as a single Buffer.
 *
 * @param req - The incoming HTTP request to buffer.
 * @returns A promise that resolves with the concatenated Buffer containing the request body.
 * @throws If an error occurs while reading the request stream.
 */

export async function bufferRequest(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
