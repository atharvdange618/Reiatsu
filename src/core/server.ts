import http from "http";
import { router } from "./router";

/**
 * Starts the HTTP server using Node's built-in `http` module.
 * Delegates all requests to the custom router.
 */
export function serve(port: number) {
  const server = http.createServer((req, res) => {
    router.handle(req, res);
  });
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
