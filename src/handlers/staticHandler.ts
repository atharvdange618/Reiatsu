import { Context } from "../types/http";

export const staticHandler = (ctx: Context) => {
  ctx.status(404).json({ message: "File not found" });
};
