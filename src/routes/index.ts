import { router } from "../core/router";
import { echoHandler } from "../handlers/echoHandler";
import { helloHandler } from "../handlers/helloHandler";
import { privateHandler } from "../handlers/privateHandler";
import { queryHandler } from "../handlers/queryHandler";
import { userHandler } from "../handlers/userHandler";
import { authMiddleware } from "../middleware/auth";
import { Context } from "../types/http";

// const legacyRoutes: Route[] = [
//   { method: "GET", path: "/", handler: helloHandler },
//   { method: "GET", path: "/user/:id", handler: userHandler },
//   {
//     method: "GET",
//     path: "/private",
//     handler: privateHandler,
//     middlewares: [authMiddleware],
//   },
//   { method: "POST", path: "/echo", handler: echoHandler },
// ];

router.get("/", helloHandler);
router.get("/user/:id", userHandler);
router.get("/private", authMiddleware, privateHandler);
router.post("/echo", echoHandler);
router.get("/search", queryHandler);

// test routes to test all http methods
router.get("/test", (ctx: Context) => {
  ctx.status?.(200).json?.({ method: "GET" });
});

router.post("/test", (ctx: Context) => {
  ctx.status?.(200).json?.({ method: "POST" });
});

router.put("/test", (ctx: Context) => {
  ctx.status?.(200).json?.({ method: "PUT" });
});

router.delete("/test", (ctx: Context) => {
  ctx.status?.(200).json?.({ method: "DELETE" });
});

router.patch("/test", (ctx: Context) => {
  ctx.status?.(200).json?.({ method: "PATCH" });
});

router.options("/test", (ctx: Context) => {
  ctx.status?.(200).json?.({ method: "OPTIONS" });
});

router.head("/test", (ctx: Context) => {
  ctx.res.writeHead(200);
  ctx.res.end();
});
