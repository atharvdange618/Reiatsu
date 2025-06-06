import { Middleware } from "../types/http";
import { AuthenticationError } from "../errors/AppError";
import { decodeJWT } from "../auth/jwt";
import { UserPayload } from "../auth/types";
import { AuthContext } from "../types/types";

export function authMiddleware(secret: string): Middleware<AuthContext> {
  return async (ctx: AuthContext, next) => {
    const authHeader = ctx.req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.isAuthenticated = false;
      throw new AuthenticationError(
        "Authorization header missing or malformed"
      );
    }

    const token = authHeader.slice(7);

    try {
      const user = decodeJWT(token, secret);
      if (
        !user ||
        typeof user !== "object" ||
        typeof user.id !== "string" ||
        typeof user.email !== "string"
      ) {
        ctx.isAuthenticated = false;
        throw new AuthenticationError("Invalid token");
      }
      ctx.user = user as UserPayload;
      ctx.isAuthenticated = true;
      await next();
    } catch (err) {
      ctx.isAuthenticated = false;
      throw new AuthenticationError("Authentication failed");
    }
  };
}
