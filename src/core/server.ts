import http from "http";
import { router } from "./router";

/**
 * Starts the HTTP server using Node's built-in `http` module.
 * Delegates all requests to the custom router.
 */
export const startServer = (port: number) => {
  const server = http.createServer((req, res) => {
    router.handle(req, res);
  });

  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
};
