import { router } from "../core/router";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError";
import { authMiddleware } from "../middleware/auth";
import { cache } from "../middleware/cache";
import { createCorsMiddleware } from "../middleware/cors";
import { getRequestId } from "../middleware/requestId";
import { uploadMiddleware } from "../middleware/upload";
import { Context } from "../types/http";
import { asyncHandler } from "../utils/asyncHandler";
import { Validator } from "../utils/validation";

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

router.get("/", (ctx: Context) => {
  ctx.status(200).json({ message: "Hello, World from Reiatsu!" });
});

router.get(
  "/user/:id",
  asyncHandler(async (ctx) => {
    const { id } = ctx.params;

    if (!id) {
      throw new ValidationError("User ID is required");
    }

    // Simulate user lookup
    if (id === "nonexistent") {
      throw new NotFoundError("User");
    }

    // Simulate authentication check
    const authHeader = ctx.req.headers.authorization;
    if (!authHeader) {
      throw new AuthenticationError();
    }

    ctx.status(200).json({
      success: true,
      data: { id, name: "John Doe", email: "john@example.com" },
    });
  })
);

router.post(
  "/user",
  asyncHandler(async (ctx) => {
    const { name, email, age } = ctx.body || {};

    // Validation
    Validator.required(name, "Name");
    Validator.required(email, "Email");
    Validator.email(email);
    Validator.minLength(name, 2, "Name");
    Validator.maxLength(name, 50, "Name");

    if (age !== undefined) {
      const validAge = Validator.isNumber(age, "Age");
      Validator.range(validAge, 0, 120, "Age");
    }

    // Simulate user creation
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      age: age ? Number(age) : undefined,
      createdAt: new Date().toISOString(),
    };

    ctx.status(201).json({
      success: true,
      data: user,
    });
  })
);

router.get("/private", authMiddleware, (ctx: Context) => {
  ctx.status(200).json({ message: "Welcome to the private route!" });
});

router.post("/echo", (ctx: Context) => {
  ctx.status(200).json({ youPosted: ctx.body });
});

router.get("/search", (ctx: Context) => {
  ctx.status(200).json({ query: ctx.query });
});

router.post("/submit-form", (ctx: Context) => {
  ctx.status(200).json({
    message: "Form submission received",
    formData: ctx.body,
  });
});

router.post(
  "/upload",
  uploadMiddleware({ dest: "uploads/pins/" }),
  async (ctx: Context) => {
    if (!ctx.files || ctx.files.length === 0) {
      return ctx.status(400).json({ error: "No files uploaded" });
    }

    ctx.json({
      message: "Files uploaded successfully",
      files: ctx.files.map((f) => ({
        originalname: f.originalname,
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
      })),
      fields: ctx.body,
    });
  }
);

router.get("/download/:filename", async (ctx: Context) => {
  let filePath = (ctx.query && ctx.query.path) || (ctx.body && ctx.body.path);
  if (!filePath) {
    filePath = `uploads/${ctx.params.filename}`;
  }
  ctx.download(filePath);
});

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
