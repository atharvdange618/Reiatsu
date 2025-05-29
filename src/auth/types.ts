import { Context } from "../types/http";

export interface UserPayload {
  id: string;
  email: string;
  role?: string;
  [key: string]: any;
}

export interface JWTAuthOptions {
  secret: string;
  algorithm?: "HS256" | "RS256";
  header?: string;
  scheme?: string;
  decodeOnly?: boolean;
  required?: boolean;
  onError?: (err: Error, ctx: Context) => void;
}
