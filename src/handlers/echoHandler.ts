import { Context } from "../types/http";

export const echoHandler = (ctx: Context) => {
  ctx.res.writeHead(200, { "Content-Type": "application/json" });
  ctx.res.end(JSON.stringify({ youPosted: ctx.body }));
};
