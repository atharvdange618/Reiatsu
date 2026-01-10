import http, { Server } from "http";
import { handleRequest } from "./router";

/**
 * Starts an HTTP server on the specified port using Node's built-in `http` module.
 * All incoming requests are delegated to the custom `handleRequest` router.
 *
 * @param port - The port number on which the server should listen.
 * @param options - Optional configuration including cleanup callback
 */
export function serve(
  port: number,
  options?: {
    onShutdown?: () => Promise<void>;
  }
) {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error("Unhandled error:", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain");
        res.end("Internal Server Error");
      }
    });
  });

  // Always-on, 10s forced shutdown timeout
  setupGracefulShutdown(server, {
    timeoutMs: 10000,
    onShutdown: options?.onShutdown,
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

/**
 * Sets up graceful shutdown handling for the provided HTTP server.
 * Ensures that the server stops accepting new connections and waits for active requests to finish before exiting.
 * Optionally, a timeout can be specified to force shutdown if requests do not complete in time.
 *
 * @param server - The HTTP server instance to manage.
 * @param opts - Optional configuration for shutdown behavior.
 * @param opts.timeoutMs - Maximum time in milliseconds to wait for active requests before forcing shutdown (default: 10000ms).
 * @param opts.onShutdown - Optional cleanup callback to run before shutdown (e.g., close database connections, clear caches)
 */
export function setupGracefulShutdown(
  server: Server,
  opts: {
    timeoutMs?: number;
    onShutdown?: () => Promise<void>;
  } = {}
) {
  let activeRequests = 0;
  let shuttingDown = false;
  const timeoutMs = opts.timeoutMs ?? 10000;

  server.on("request", (req, res) => {
    if (shuttingDown) {
      res.setHeader("Connection", "close");
      res.statusCode = 503;
      res.end("Server is shutting down");
      return;
    }
    activeRequests++;
    res.on("finish", () => activeRequests--);
  });

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    if (opts.onShutdown) {
      try {
        console.log("Running shutdown cleanup...");
        await opts.onShutdown();
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    }

    server.close(() => {
      if (activeRequests === 0) process.exit(0);
    });
    const check = () => {
      if (activeRequests === 0) process.exit(0);
      setTimeout(check, 100);
    };
    check();
    setTimeout(() => process.exit(1), timeoutMs);
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
