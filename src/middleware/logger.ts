import { LogData, LoggerOptions, Middleware } from "../types/http";
import { RequestIdContext } from "../types/types";

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
 * Creates a logger middleware for HTTP request/response logging.
 *
 * This middleware logs incoming requests, outgoing responses, and errors with configurable options.
 * It captures details such as request method, URL, headers, body, user agent, client IP, timestamps,
 * response status code, and duration. Logging behavior can be customized via the `LoggerOptions` parameter.
 *
 * @param options - Optional configuration for logging behavior. Merges with default logger options.
 * @returns A middleware function compatible with the application's middleware pipeline.
 *
 * @example
 * ```typescript
 * app.use(createLoggerMiddleware({ logHeaders: true, logBody: false }));
 * ```
 */
export const createLoggerMiddleware = (
  options: LoggerOptions = {}
): Middleware<RequestIdContext> => {
  const config = { ...DEFAULT_LOGGER_OPTIONS, ...options };

  return async (ctx, next) => {
    const { method, url } = ctx.req;
    const start = Date.now();

    const createLogData = (): LogData => ({
      requestId: ctx.requestId,
      method: method || "UNKNOWN",
      url: url || "/",
      userAgent: ctx.req.headers["user-agent"],
      ip: getClientIp(ctx.req),
      timestamp: new Date().toISOString(),
      headers: config.logHeaders ? ctx.req.headers : undefined,
      body: config.logBody && ctx.body ? ctx.body : undefined,
    });

    console.log(formatIncomingRequest(createLogData(), config));

    try {
      await next();

      const duration = Date.now() - start;
      const responseLogData = createLogData();
      responseLogData.duration = duration;
      responseLogData.statusCode = ctx.res.statusCode;

      console.log(formatOutgoingResponse(responseLogData, config));
    } catch (error) {
      const duration = Date.now() - start;
      const errorLogData = createLogData();
      errorLogData.duration = duration;
      errorLogData.statusCode = ctx.res.statusCode || 500;

      console.error(formatErrorResponse(errorLogData, config));
      throw error;
    }
  };
};

/**
 * Default logger middleware with sensible defaults
 */
export const loggerMiddleware: Middleware<RequestIdContext> =
  createLoggerMiddleware();

/**
 * Development logger with more verbose output
 */
export const devLoggerMiddleware: Middleware<RequestIdContext> =
  createLoggerMiddleware({
    logHeaders: true,
    logBody: true,
    colorize: true,
  });

/**
 * Production logger with minimal output
 */
export const prodLoggerMiddleware: Middleware<RequestIdContext> =
  createLoggerMiddleware({
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
