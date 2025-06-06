import { UserPayload } from "../auth/types";
import { UploadedFile } from "./http";

declare module "../core/context" {
  interface Context<TParams extends Record<string, string> = {}> {
    files?: UploadedFile[];
    body?: any;

    isAuthenticated: boolean;
    user?: UserPayload;
  }
}
