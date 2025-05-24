import { Context } from "../types/http";

export const privateHandler = (ctx: Context) => {
  ctx.status(200).json({ message: "Welcome to the private route!" });
};
