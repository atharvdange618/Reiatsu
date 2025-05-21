import { Context } from "../types/http";

export const formHandler = (ctx: Context) => {
  ctx.status?.(200).json?.({
    message: "Form submission received",
    formData: ctx.body,
  });
};
