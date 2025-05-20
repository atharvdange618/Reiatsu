import { IncomingMessage, ServerResponse } from "http";

export const helloHandler = (req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200, {
    "Content-Type": "text/plain",
  });
  res.end("Hello, World from Sage!");
};
