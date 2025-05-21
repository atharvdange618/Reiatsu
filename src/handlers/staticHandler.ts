import { Context } from "../types/http";

export const staticHandler = (ctx: Context) => {
  ctx.res.writeHead(404).end("File not found");
};
