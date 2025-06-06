import { UploadedFile } from "./http";
import { UserPayload } from "../auth/types";
import { Context } from "../core/context";

export type AuthContext<
  TParams extends Record<string, string> = Record<string, string>
> = Context<TParams> & {
  isAuthenticated: boolean;
  user: UserPayload;
};

export type RequestIdContext<
  TParams extends Record<string, string> = Record<string, string>
> = Context<TParams> & {
  requestId: string;
};

export type UploadContext<
  TParams extends Record<string, string> = Record<string, string>
> = Context<TParams> & {
  files: UploadedFile[];
};
