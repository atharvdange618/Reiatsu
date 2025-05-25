import { router } from "../core/router";
import { echoHandler } from "../handlers/echoHandler";
import { formHandler } from "../handlers/formHandler";
import { helloHandler } from "../handlers/helloHandler";
import { privateHandler } from "../handlers/privateHandler";
import { queryHandler } from "../handlers/queryHandler";
import { createUserHandler, getUserHandler } from "../handlers/userHandler";
import { authMiddleware } from "../middleware/auth";
import { cache } from "../middleware/cache";
import { createCorsMiddleware } from "../middleware/cors";
import { getRequestId } from "../middleware/requestId";
import { Context } from "../types/http";
import { asyncHandler } from "../utils/asyncHandler";

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
router.get("/user/:id", asyncHandler(getUserHandler));
router.post("/user", asyncHandler(createUserHandler));
router.get("/private", authMiddleware, privateHandler);
router.post("/echo", echoHandler);
router.get("/search", queryHandler);
router.post("/submit-form", formHandler);

router.get("/expensive", cache(30), async (ctx: Context) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const now = new Date().toISOString();
  ctx.status(200).json({ servedAt: now });
});

router.get("/render-ejs", async (ctx: Context) => {
  await ctx.renderFile("index.ejs", {
    title: "My Grocery List",
    items: ["Apple", "Banana", "Cherry"],
  });
});

router.get("/inline", async (ctx: Context) => {
  const tpl = "<h1><%= title %></h1>";
  ctx.render(tpl, { title: "Inline Render" });
});

router.get("/info", async (ctx: Context) => {
  if (ctx.is("json")) {
    ctx.json({
      ip: ctx.ip,
      protocol: ctx.protocol,
      userAgent: ctx.get("User-Agent"),
      query: ctx.query,
      cookies: ctx.cookies,
    });
  } else {
    ctx.text("Expected JSON request");
  }
});

router.get("/me", (ctx: Context) => {
  ctx.cookie("session", "abcd1234", { httpOnly: true, maxAge: 3600 });
  ctx.status(200).json({ hello: "world" });
});

router.get("/download", (ctx: Context) => {
  ctx.download("./public/index.html", "index.html");
});

router.get("/hello", (ctx: Context) => {
  ctx.redirect("/");
});

router.get("/welcome", (ctx: Context) => {
  ctx.html(`<h1>Welcome to Reiatsu</h1>`);
});

router.get("/data.csv", (ctx: Context) => {
  const csv = "id,name\n1,Alice\n2,Bob\n";
  ctx.send(csv, "text/csv; charset=utf-8");
});

router.get("/feed", (ctx: Context) => {
  const rss = `<rss>…</rss>`;
  ctx.xml(rss);
});

router.get(
  "/api/public",
  createCorsMiddleware({ origin: "*" }),
  (ctx: Context) => {
    ctx.status(200).json({
      message: "Public API endpoint",
      requestId: getRequestId(ctx),
    });
  }
);

router.post("/api/users", async (ctx: Context) => {
  const requestId = getRequestId(ctx);

  console.log(`[${requestId}] Creating user:`, ctx.body);

  try {
    // Simulate user creation
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      ...ctx.body,
      createdAt: new Date().toISOString(),
    };

    console.log(`[${requestId}] User created successfully:`, user.id);

    ctx.status(201).json({
      success: true,
      data: user,
      meta: {
        requestId: requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Failed to create user:`, error);
    throw error;
  }
});

router.get("/api/error-example", (ctx: Context) => {
  const requestId = getRequestId(ctx);

  // Simulate an error
  throw new Error(`Something went wrong [${requestId}]`);
});

// test routes to test all http methods
router.get("/test", (ctx: Context) => {
  ctx.status(200).json({ method: "GET" });
});

router.post("/test", (ctx: Context) => {
  ctx.status(200).json({ method: "POST" });
});

router.put("/test", (ctx: Context) => {
  ctx.status(200).json({ method: "PUT" });
});

router.delete("/test", (ctx: Context) => {
  ctx.status(200).json({ method: "DELETE" });
});

router.patch("/test", (ctx: Context) => {
  ctx.status(200).json({ method: "PATCH" });
});

router.options("/test", (ctx: Context) => {
  ctx.status(200).json({ method: "OPTIONS" });
});

router.head("/test", (ctx: Context) => {
  ctx.res.writeHead(200);
  ctx.res.end();
});
