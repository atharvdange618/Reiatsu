import { Context } from "../types/http";

export const echoHandler = (ctx: Context) => {
  ctx.status(200).json({ youPosted: ctx.body });
};
