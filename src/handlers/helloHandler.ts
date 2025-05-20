import { Context } from "../types/http";

export const helloHandler = (ctx: Context) => {
  const { res } = ctx;

  res.writeHead(200, {
    "Content-Type": "text/plain",
  });
  res.end("Hello, World from Sage!");
};
