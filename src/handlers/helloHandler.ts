import { Context } from "../types/http";

export const helloHandler = (ctx: Context) => {
  ctx.status(200).json({ message: "Hello, World from Reiatsu!" });
};
