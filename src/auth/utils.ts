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

// Simplified HMAC verifier (for HS256)
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
