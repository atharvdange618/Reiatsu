import { helloHandler } from "../handlers/helloHandler";
import { privateHandler } from "../handlers/privateHandler";
import { userHandler } from "../handlers/userHandler";
import { authMiddleware } from "../middleware/auth";
import { Route } from "../types/http";

export const routes: Route[] = [
  { method: "GET", path: "/", handler: helloHandler },
  { method: "GET", path: "/user/:id", handler: userHandler },
  {
    method: "GET",
    path: "/private",
    handler: privateHandler,
    middlewares: [authMiddleware],
  },
];
