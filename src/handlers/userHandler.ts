import { Context } from "../types/http";

/**
 * Example route handler that returns the user ID passed via route param.
 * Route: GET /user/:id
 */
export const userHandler = (ctx: Context) => {
  const { res, params } = ctx;
  const id = params.id;

  res.writeHead(200, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify({ userId: id }));
};
