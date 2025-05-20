import { IncomingMessage, ServerResponse } from "http";
import { helloHandler } from "../handlers/helloHandler";

type RouteHandler = (req: IncomingMessage, res: ServerResponse) => void;

const routes: Record<string, RouteHandler> = {
  "GET /": helloHandler,
};

export const router = {
  handle(req: IncomingMessage, res: ServerResponse) {
    const key = `${req.method} ${req.url}`;
    const handler = routes[key] || notFoundHandler;
    handler(req, res);
  },
};

const notFoundHandler: RouteHandler = (req, res) => {
  res.writeHead(404, {
    "Content-Type": "text/plain",
  });
  res.end("Not Found");
};
