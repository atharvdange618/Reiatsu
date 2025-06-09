import { Middleware } from "../types/http";
import { AuthenticationError } from "../errors/AppError";
import { decodeJWT } from "../auth/jwt";
import { UserPayload } from "../auth/types";
import { AuthContext } from "../types/types";

/**
 * Creates an authentication middleware that validates JWT tokens from the `Authorization` header.
 *
 * @param secret - The secret key used to verify the JWT token.
 * @returns A middleware function that authenticates requests and populates the context with user information.
 *
 * @throws {AuthenticationError} If the authorization header is missing, malformed, or the token is invalid.
 *
 * @example
 * app.use(authMiddleware(process.env.JWT_SECRET));
 */
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
