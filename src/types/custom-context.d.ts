import { UserPayload } from "../auth/types";
import { UploadedFile } from "./http";

/**
 * Context properties added by the auth middleware.
 * Use this interface when you need type-safe access to auth context.
 *
 * @example
 * ```typescript
 * import { AuthContext } from "@reiatsu/types";
 *
 * const handler = (ctx: Context & AuthContext) => {
 *   if (ctx.isAuthenticated) {
 *     console.log(ctx.user.sub);
 *   }
 * };
 * ```
 */
export interface AuthContext {
  isAuthenticated: boolean;
  user?: UserPayload;
}

/**
 * Context properties added by the requestId middleware.
 * Use this interface when you need type-safe access to request IDs.
 *
 * @example
 * ```typescript
 * import { RequestIdContext } from "@reiatsu/types";
 *
 * const handler = (ctx: Context & RequestIdContext) => {
 *   console.log(ctx.requestId);
 * };
 * ```
 */
export interface RequestIdContext {
  requestId: string;
}

/**
 * Context properties added by the upload middleware.
 * Use this interface when you need type-safe access to uploaded files.
 *
 * @example
 * ```typescript
 * import { UploadContext } from "@reiatsu/types";
 *
 * const handler = (ctx: Context & UploadContext) => {
 *   ctx.files?.forEach(file => {
 *     console.log(file.filename);
 *   });
 * };
 * ```
 */
export interface UploadContext {
  files?: UploadedFile[];
}

/**
 * Context properties added by the bodyParser middleware.
 * Use this interface when you need type-safe access to parsed body.
 *
 * @example
 * ```typescript
 * import { BodyContext } from "@reiatsu/types";
 *
 * const handler = (ctx: Context & BodyContext) => {
 *   const data = ctx.body as MyBodyType;
 * };
 * ```
 */
export interface BodyContext {
  body?: any;
}

declare module "../core/context" {
  interface Context<TParams extends Record<string, string> = {}>
    extends AuthContext,
      RequestIdContext,
      UploadContext,
      BodyContext {}
}
