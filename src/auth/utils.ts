import { createHmac } from "crypto";

export function extractTokenFromHeader(
  headerValue: string | undefined,
  scheme: string = "Bearer"
): string | null {
  if (!headerValue) return null;
  const [prefix, token] = headerValue.split(" ");
  if (prefix !== scheme || !token) return null;
  return token;
}

/**
 * Verifies the HMAC signature of a token and returns its decoded payload.
 *
 * The token is expected to be in the format `header.payload.signature`, where each part is base64url-encoded.
 * The function recalculates the signature using the provided secret and compares it to the signature in the token.
 * If the signature is valid, the payload is decoded and parsed as JSON.
 *
 * @param token - The HMAC-signed token string to verify.
 * @param secret - The secret key used to verify the HMAC signature.
 * @returns The decoded payload as an object.
 * @throws {Error} If the token's signature is invalid or if the payload cannot be parsed.
 */
export function verifyHMAC(token: string, secret: string): any {
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  if (expectedSig !== signatureB64) {
    throw new Error("Invalid token signature");
  }

  const json = Buffer.from(payloadB64, "base64url").toString("utf-8");
  return JSON.parse(json);
}
