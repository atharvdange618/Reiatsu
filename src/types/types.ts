import { Context } from "../core/context";
import {
  AuthContext as IAuthContext,
  RequestIdContext as IRequestIdContext,
  UploadContext as IUploadContext,
  BodyContext,
} from "./custom-context";

/**
 * Type alias for Context with auth middleware properties.
 * @deprecated Use `Context & AuthContext` instead for better composability.
 */
export type AuthContext<
  TParams extends Record<string, string> = Record<string, string>
> = Context<TParams> & IAuthContext;

/**
 * Type alias for Context with requestId middleware properties.
 * @deprecated Use `Context & RequestIdContext` instead for better composability.
 */
export type RequestIdContext<
  TParams extends Record<string, string> = Record<string, string>
> = Context<TParams> & IRequestIdContext;

/**
 * Type alias for Context with upload middleware properties.
 * @deprecated Use `Context & UploadContext` instead for better composability.
 */
export type UploadContext<
  TParams extends Record<string, string> = Record<string, string>
> = Context<TParams> & IUploadContext;

// Re-export the interfaces for easy access
export type {
  IAuthContext as AuthContextInterface,
  IRequestIdContext as RequestIdContextInterface,
  IUploadContext as UploadContextInterface,
  BodyContext,
};
