import { Context } from "../types/http";

export const privateHandler = (ctx: Context) => {
  ctx.res.writeHead(200, { "Content-Type": "application/json" });
  ctx.res.end(JSON.stringify({ message: "Welcome to the private route!" }));
};
