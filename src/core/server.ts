import http from "http";
import { handleRequest } from "./router";

/**
 * Starts the HTTP server using Node's built-in `http` module.
 * Delegates all requests to the custom router.
 */
export function serve(port: number) {
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

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
