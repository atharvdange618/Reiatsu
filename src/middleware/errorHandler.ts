import { Middleware } from "../types/http";
import { AppError, ValidationError } from "../errors/AppError";

interface ErrorResponse {
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

export const errorHandlerMiddleware: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    // Log the error
    logError(err, ctx);

    // Handle the error and send response
    handleError(err, ctx);
  }
};

function logError(err: any, ctx: any) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const isOperationalError = err instanceof AppError && err.isOperational;

  if (!isOperationalError || isDevelopment) {
    console.error("🔥 Error Details:", {
      message: err.message,
      stack: err.stack,
      url: ctx.req.url,
      method: ctx.req.method,
      headers: ctx.req.headers,
      body: ctx.body,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.warn("⚠️  Operational Error:", {
      message: err.message,
      errorCode: err.errorCode,
      statusCode: err.statusCode,
      url: ctx.req.url,
      method: ctx.req.method,
      timestamp: new Date().toISOString(),
    });
  }
}

function handleError(err: any, ctx: any) {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (ctx.res.headersSent) {
    return console.error("Cannot send error response - headers already sent");
  }

  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "Internal Server Error";
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.errorCode || "APP_ERROR";
    details = err.details;
  } else if (err.code === "ENOENT") {
    statusCode = 404;
    message = "Resource not found";
    errorCode = "RESOURCE_NOT_FOUND";
  } else if (err.name === "SyntaxError" && err.message.includes("JSON")) {
    statusCode = 400;
    message = "Invalid JSON format";
    errorCode = "INVALID_JSON";
  } else if (err.code === "ECONNREFUSED") {
    statusCode = 503;
    message = "Service temporarily unavailable";
    errorCode = "SERVICE_UNAVAILABLE";
  }

  const errorResponse: ErrorResponse = {
    error: "Error",
    message,
    statusCode,
    errorCode,
    timestamp: new Date().toISOString(),
    path: ctx.req.url || "",
    method: ctx.req.method || "",
  };

  if (details && (isDevelopment || err instanceof ValidationError)) {
    errorResponse.details = details;
  }

  if (isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  ctx.res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "X-Error-Code": errorCode,
  });
  ctx.res.end(JSON.stringify(errorResponse, null, isDevelopment ? 2 : 0));
}
