import { Context } from "../core/context";

/**
 * Type for extracted query parameters.
 */
export type QueryParams = Record<string, string | string[]>;

/**
 * HTTP method types.
 */
export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

/**
 * Utility type to extract route parameters from a path string.
 * Supports:
 * - :param (basic parameters)
 * - :param(regex) (parameters with regex constraints)
 * - * (wildcard matching - only if it's the last significant segment)
 */
export type ExtractRouteParams<Path extends string> = Path extends `/${infer P}`
  ? ExtractRouteParams<P>
  : Path extends `${infer P}/`
  ? ExtractRouteParams<P>
  : ExtractParamsFromPathSegments<Path, {}>;

type ExtractParamsFromPathSegments<
  PathSegment extends string,
  Acc extends Record<string, string>
> = PathSegment extends `${infer Segment}/${infer Rest}`
  ? ExtractParamsFromPathSegments<
      Rest,
      Acc & ExtractParamOrWildcardFromSegment<Segment>
    >
  : Acc & ExtractParamOrWildcardFromSegment<PathSegment>;

type ExtractParamOrWildcardFromSegment<Segment extends string> =
  Segment extends `*`
    ? { wildcard: string }
    : Segment extends `:${infer ParamName extends string}(${infer _Regex})`
    ? { [K in ParamName]: string }
    : Segment extends `:${infer ParamName extends string}`
    ? { [K in ParamName]: string }
    : {};

/**
 * Function signature for route handlers.
 */
export type Handler<
  Path extends string,
  Ctx extends Context<ExtractRouteParams<Path>> = Context<
    ExtractRouteParams<Path>
  >
> = (ctx: Ctx) => Promise<void> | void;

/**
 * Function signature for route middlewares.
 */
export type Middleware<Ctx extends Context<any> = Context<any>> = (
  ctx: Ctx,
  next: () => void | Promise<void>
) => void | Promise<void>;

/**
 * Represents a compiled route definition.
 */
export interface CompiledRoute<Path extends string = string> {
  method: HTTPMethod;
  path: Path;
  handler: Handler<Path, any>;
  middlewares?: Middleware<any>[];
  regex: RegExp;
  paramNames: string[];
  hasWildcard: boolean;
}

export interface CookieOptions {
  maxAge?: number; // in seconds
  domain?: string;
  path?: string; // defaults to '/'
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  errorCode?: string;
  details?: any;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

export interface LoggerOptions {
  /**
   * Whether to include request ID in logs
   * @default true
   */
  includeRequestId?: boolean;

  /**
   * Whether to log request body (be careful with sensitive data)
   * @default false
   */
  logBody?: boolean;

  /**
   * Whether to log request headers
   * @default false
   */
  logHeaders?: boolean;

  /**
   * Custom log format function
   */
  formatter?: (logData: LogData) => string;

  /**
   * Whether to colorize output (useful for development)
   * @default true if NODE_ENV !== 'production'
   */
  colorize?: boolean;
}

export interface LogData {
  requestId?: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  body?: any;
  headers?: Record<string, any>;
  timestamp: string;
}

export interface RequestIdOptions {
  /**
   * Header name to read existing request ID from
   * @default "x-request-id"
   */
  header?: string;

  /**
   * Whether to generate a new ID if none exists in headers
   * @default true
   */
  generate?: boolean;

  /**
   * Custom ID generator function
   * @default undefined (uses built-in generator)
   */
  generator?: () => string;

  /**
   * Whether to set the request ID in response headers
   * @default true
   */
  setResponseHeader?: boolean;

  /**
   * Response header name for the request ID
   * @default "x-request-id"
   */
  responseHeader?: string;
}

export interface CacheEntry {
  timestamp: number;
  ttl: number; // milliseconds
  statusCode: number;
  headers: Record<string, string>;
  body: Buffer | string;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface FileUploadOptions {
  dest: string;
  fieldName?: string;
  uploadDir?: string;
  maxFileSize?: number;
  mimeTypes?: Record<string, string>;
}

export interface MultipartPart {
  headers: string[];
  name: string;
  filename?: string;
  contentType?: string;
  data: Buffer;
}

export interface SaveFileOptions {
  dest: string;
  originalname: string;
  data: Buffer;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  mimetype: string;
}
