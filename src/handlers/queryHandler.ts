import { Context } from "../types/http";

export const queryHandler = (ctx: Context) => {
  ctx.status?.(200).json?.({ query: ctx.query });
};
