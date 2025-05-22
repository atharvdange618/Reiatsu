import { Middleware } from "../types/http";

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

const DEFAULT_LOGGER_OPTIONS: Required<Omit<LoggerOptions, "formatter">> & {
  formatter?: LoggerOptions["formatter"];
} = {
  includeRequestId: true,
  logBody: false,
  logHeaders: false,
  colorize: process.env.NODE_ENV !== "production",
  formatter: undefined,
};

/**
 * Creates a logger middleware with the specified options
 */
export const createLoggerMiddleware = (
  options: LoggerOptions = {}
): Middleware => {
  const config = { ...DEFAULT_LOGGER_OPTIONS, ...options };

  return async (ctx, next) => {
    const { method, url } = ctx.req;
    const start = Date.now();
    const timestamp = new Date().toISOString();

    const logData: LogData = {
      requestId: ctx.requestId,
      method: method || "UNKNOWN",
      url: url || "/",
      userAgent: ctx.req.headers["user-agent"],
      ip: getClientIp(ctx.req),
      timestamp,
    };

    if (config.logHeaders) {
      logData.headers = ctx.req.headers;
    }

    if (config.logBody && ctx.body) {
      logData.body = ctx.body;
    }

    // Log incoming request
    console.log(formatIncomingRequest(logData, config));

    try {
      await next();

      // Log successful response
      const duration = Date.now() - start;
      logData.duration = duration;
      logData.statusCode = ctx.res.statusCode;

      console.log(formatOutgoingResponse(logData, config));
    } catch (error) {
      // Log error response
      const duration = Date.now() - start;
      logData.duration = duration;
      logData.statusCode = ctx.res.statusCode || 500;

      console.log(formatErrorResponse(logData, config));
      throw error; // Re-throw to let error middleware handle it
    }
  };
};

/**
 * Default logger middleware with sensible defaults
 */
export const loggerMiddleware: Middleware = createLoggerMiddleware();

/**
 * Development logger with more verbose output
 */
export const devLoggerMiddleware: Middleware = createLoggerMiddleware({
  logHeaders: true,
  logBody: true,
  colorize: true,
});

/**
 * Production logger with minimal output
 */
export const prodLoggerMiddleware: Middleware = createLoggerMiddleware({
  logHeaders: false,
  logBody: false,
  colorize: false,
});

// Helper functions
function getClientIp(req: any): string {
  return (
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function formatIncomingRequest(
  logData: LogData,
  config: Required<Omit<LoggerOptions, "formatter">> & {
    formatter?: LoggerOptions["formatter"];
  }
): string {
  if (config.formatter) {
    return config.formatter(logData);
  }

  const requestIdPart =
    config.includeRequestId && logData.requestId
      ? `[${logData.requestId}] `
      : "";

  const colorStart = config.colorize ? "\x1b[36m" : ""; // Cyan
  const colorEnd = config.colorize ? "\x1b[0m" : "";

  return `${colorStart}-->${colorEnd} ${requestIdPart}${logData.method} ${logData.url}`;
}

function formatOutgoingResponse(
  logData: LogData,
  config: Required<Omit<LoggerOptions, "formatter">> & {
    formatter?: LoggerOptions["formatter"];
  }
): string {
  if (config.formatter) {
    return config.formatter(logData);
  }

  const requestIdPart =
    config.includeRequestId && logData.requestId
      ? `[${logData.requestId}] `
      : "";

  const statusColor = getStatusColor(
    logData.statusCode || 200,
    config.colorize
  );
  const colorEnd = config.colorize ? "\x1b[0m" : "";

  return `${statusColor}<--${colorEnd} ${requestIdPart}${logData.method} ${logData.url} ${logData.statusCode} ${logData.duration}ms`;
}

function formatErrorResponse(
  logData: LogData,
  config: Required<Omit<LoggerOptions, "formatter">> & {
    formatter?: LoggerOptions["formatter"];
  }
): string {
  if (config.formatter) {
    return config.formatter(logData);
  }

  const requestIdPart =
    config.includeRequestId && logData.requestId
      ? `[${logData.requestId}] `
      : "";

  const colorStart = config.colorize ? "\x1b[31m" : ""; // Red
  const colorEnd = config.colorize ? "\x1b[0m" : "";

  return `${colorStart}<!>${colorEnd} ${requestIdPart}${logData.method} ${logData.url} ${logData.statusCode} ${logData.duration}ms`;
}

function getStatusColor(statusCode: number, colorize: boolean): string {
  if (!colorize) return "";

  if (statusCode >= 500) return "\x1b[31m"; // Red
  if (statusCode >= 400) return "\x1b[33m"; // Yellow
  if (statusCode >= 300) return "\x1b[36m"; // Cyan
  if (statusCode >= 200) return "\x1b[32m"; // Green
  return "\x1b[37m"; // White
}
