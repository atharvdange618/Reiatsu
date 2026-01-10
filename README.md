# Reiatsu

![npm](https://img.shields.io/npm/v/reiatsu)
![npm](https://img.shields.io/npm/dm/reiatsu)
![GitHub stars](https://img.shields.io/github/stars/atharvdange618/reiatsu?style=flat-square&color=ff69b4)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-ff69b4?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-First-ff69b4?style=flat-square)

A minimal, type-safe HTTP framework for Node.js built from first principles using **zero dependencies**. Production-ready with comprehensive security, performance optimizations, and modern developer experience.

## Quick Start

```bash
npm i reiatsu
```

```typescript
import { router, serve } from "reiatsu";

router.get("/", (ctx) => {
  ctx.json({ message: "Hello, World!" });
});

serve(3000);
```

## Key Features

### Core

- **Zero Dependencies** - Pure Node.js, no external packages
- **TypeScript First** - Fully typed with intelligent route parameter inference
- **High Performance** - Built on Node.js `http` module with streaming support
- **Advanced Routing** - Dynamic params, wildcards, and pattern matching

### Security & Performance

- **Comprehensive Security** - CSRF protection, sanitization, security headers, timing-safe operations
- **Smart Compression** - Automatic gzip/Brotli compression
- **Response Streaming** - Memory-efficient large file handling
- **Input Validation** - Type-safe, composable validators

### Developer Experience

- **Middleware Composition** - Reusable middleware stacks
- **Built-in Auth** - JWT authentication with helpers
- **Template Engine** - EJS-like syntax with automatic escaping
- **Rich Middleware** - CORS, rate limiting, logging, caching, and more

## Table of Contents

- [Core Concepts](#-core-concepts)
- [Routing](#-routing)
- [Middleware](#-middleware)
- [Security](#-security)
- [Performance](#-performance)
- [Validation](#-validation)
- [Authentication](#-authentication)
- [Error Handling](#-error-handling)
- [Production Setup](#-production-setup)

## Core Concepts

### Basic Server

```typescript
import { router, serve, use } from "reiatsu";

// Add global middleware
use(bodyParserMiddleware);
use(errorHandlerMiddleware);

// Define routes
router.get("/users/:id", (ctx) => {
  ctx.json({ id: ctx.params.id }); // TypeScript knows params.id exists!
});

// Start server with graceful shutdown
serve(3000, {
  onShutdown: async () => {
    await db.close(); // Cleanup resources
  },
});
```

### Context API

The `Context` object provides everything you need:

```typescript
router.post("/api/data", async (ctx) => {
  // Request data
  const body = ctx.body; // Parsed body
  const token = ctx.header("authorization");
  const userId = ctx.params.id; // Route params (typed!)
  const page = ctx.query?.page; // Query params

  // Response helpers (chainable)
  ctx.status(201).json({ success: true });

  // Other responses
  ctx.text("Hello"); // Plain text
  ctx.html("<h1>Hi</h1>"); // HTML
  ctx.redirect("/login"); // Redirect
  ctx.download("file.pdf"); // File download
  ctx.streamFile("video.mp4"); // Stream large files
});
```

## Routing

```typescript
// Basic routes
router.get("/", (ctx) => ctx.json({ status: "ok" }));
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Dynamic parameters (fully typed)
router.get("/posts/:postId/comments/:commentId", (ctx) => {
  // TypeScript knows: ctx.params = { postId: string, commentId: string }
  const { postId, commentId } = ctx.params;
});

// Wildcards
router.get("/files/*", (ctx) => {
  // Matches /files/anything/here
});

// Route-specific middleware
router.post("/protected", authMiddleware("secret"), rateLimiter(10), handler);
```

## Middleware

### Global Middleware

```typescript
import {
  use,
  bodyParserMiddleware,
  createLoggerMiddleware,
  securityHeadersMiddleware,
  createCompressionMiddleware,
  csrfMiddleware,
  corsPresets,
} from "reiatsu";

// Apply to all routes
use(errorHandlerMiddleware); // Error handling
use(bodyParserMiddleware); // Parse JSON/form data
use(createLoggerMiddleware()); // Request logging
use(securityHeadersMiddleware); // Security headers (CSP, HSTS, etc.)
use(createCompressionMiddleware()); // gzip/Brotli compression
use(csrfMiddleware); // CSRF protection
use(corsPresets.development()); // CORS
```

### Composable Middleware Stacks

```typescript
import { compose } from "reiatsu";

// Create reusable stacks
const authStack = compose(
  requestIdMiddleware,
  loggerMiddleware,
  authMiddleware("secret")
);

const apiStack = compose(corsMiddleware, createRateLimiter(100), authStack);

// Use in routes
router.post("/api/protected", apiStack, handler);
```

### Built-in Middleware

| Middleware                       | Purpose                   | Example                                            |
| -------------------------------- | ------------------------- | -------------------------------------------------- |
| `bodyParserMiddleware`           | Parse JSON/form data      | Auto-applied                                       |
| `securityHeadersMiddleware`      | CSP, HSTS, XSS protection | `use(securityHeadersMiddleware)`                   |
| `createCompressionMiddleware()`  | gzip/Brotli compression   | `use(createCompressionMiddleware({ level: 6 }))`   |
| `csrfMiddleware`                 | CSRF protection           | `use(csrfMiddleware)`                              |
| `createCorsMiddleware()`         | CORS configuration        | `use(corsPresets.production(["https://app.com"]))` |
| `createRateLimiter(max, window)` | Rate limiting             | `use(createRateLimiter(100, 15*60*1000))`          |
| `authMiddleware(secret)`         | JWT authentication        | `use(authMiddleware("secret"))`                    |
| `cache(ttlSeconds)`              | Response caching          | `router.get("/data", cache(60), handler)`          |
| `serveStatic(dir)`               | Static file serving       | `use(serveStatic("public"))`                       |
| `createTimeoutMiddleware(ms)`    | Request timeouts          | `use(createTimeoutMiddleware(30000))`              |

## Security

### Comprehensive Protection

```typescript
import {
  securityHeadersMiddleware,
  csrfMiddleware,
  createRateLimiter,
  escapeHtml,
  sanitizeFilename,
  sanitizeUrl,
} from "reiatsu";

// Security headers (CSP, HSTS, X-Frame-Options, etc.)
use(securityHeadersMiddleware);

// CSRF protection
use(csrfMiddleware);

// Rate limiting
use(createRateLimiter(100, 15 * 60 * 1000)); // 100 req/15min

// Input sanitization
router.post("/comment", (ctx) => {
  const safe = escapeHtml(ctx.body.comment); // Prevent XSS
  const filename = sanitizeFilename(ctx.body.file); // Prevent path traversal
  const url = sanitizeUrl(ctx.body.link); // Validate URLs
});
```

### CSRF Protection

```typescript
// Middleware auto-generates tokens
use(csrfMiddleware);

// In HTML forms
router.get("/form", (ctx) => {
  ctx.html(`
    <form method="POST">
      <input type="hidden" name="_csrf" value="${ctx.csrfToken}">
      <button>Submit</button>
    </form>
  `);
});

// For AJAX (send token in header)
// X-CSRF-Token: <token-from-cookie>
```

### Sanitization Utilities

```typescript
import { escapeHtml, stripHtml, sanitizeFilename, sanitizeUrl } from "reiatsu";

escapeHtml('<script>alert("XSS")</script>');
// → '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'

sanitizeFilename("../../etc/passwd");
// → '.._.._etc_passwd'

sanitizeUrl('javascript:alert("XSS")');
// → '#'
```

## Performance

### Response Compression

```typescript
import { createCompressionMiddleware } from "reiatsu";

// Automatic gzip/Brotli compression
use(
  createCompressionMiddleware({
    threshold: 1024, // Min size to compress (bytes)
    level: 6, // Compression level (0-9)
    preferBrotli: true, // Use Brotli when available
  })
);
// 15-20% better compression with Brotli!
```

### Streaming Large Files

```typescript
// Memory-efficient file streaming
router.get("/video/:id", (ctx) => {
  ctx.streamFile(`./videos/${ctx.params.id}.mp4`);
  // Streams directly to client, low memory usage
});

// Stream any readable
import { createReadStream } from "fs";
router.get("/data", (ctx) => {
  const stream = createReadStream("large-file.json");
  ctx.stream(stream, { contentType: "application/json" });
});
```

### Response Caching

```typescript
import { cache } from "reiatsu";

// Cache responses for 5 minutes
router.get("/api/stats", cache(300), async (ctx) => {
  const stats = await getExpensiveStats();
  ctx.json(stats);
});
```

## Validation

Type-safe, composable validators:

```typescript
import {
  ObjectValidator,
  StringValidator,
  NumberValidator,
  ArrayValidator,
} from "reiatsu";

const userValidator = new ObjectValidator({
  name: new StringValidator()
    .required()
    .min(2, "Too short")
    .max(50, "Too long"),
  email: new StringValidator().required().email("Invalid email"),
  age: new NumberValidator().min(0).max(120),
  tags: new ArrayValidator(new StringValidator().min(1)),
});

router.post("/users", async (ctx) => {
  const result = await userValidator.validate(ctx.body);
  if (result.error) {
    return ctx.status(400).json({ errors: result.error });
  }
  const user = result.value; // Validated data
  ctx.json({ success: true, user });
});
```

## Authentication

Built-in JWT authentication:

```typescript
import { authMiddleware, signJWT, decodeJWT } from "reiatsu";

// Global authentication
use(authMiddleware(process.env.JWT_SECRET!));

// Protected routes
router.get("/profile", (ctx) => {
  if (!ctx.isAuthenticated) {
    return ctx.status(401).json({ error: "Unauthorized" });
  }
  ctx.json({ user: ctx.user }); // Auto-populated from JWT
});

// Per-route auth
router.get("/admin", authMiddleware(process.env.JWT_SECRET!), (ctx) => {
  ctx.json({ message: "Admin area", user: ctx.user });
});

// Create tokens
router.post("/login", async (ctx) => {
  const user = await validateCredentials(ctx.body);
  const token = signJWT(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET!,
    "24h"
  );
  ctx.json({ token });
});
```

## Error Handling

Centralized error handling with custom error classes:

```typescript
import {
  errorHandlerMiddleware,
  AppError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
} from "reiatsu";

// Global error handler (add first!)
use(errorHandlerMiddleware);

// Throw typed errors
router.get("/users/:id", async (ctx) => {
  const user = await findUser(ctx.params.id);
  if (!user) {
    throw new NotFoundError("User");
  }
  ctx.json(user);
});

router.post("/admin", (ctx) => {
  if (!ctx.user?.isAdmin) {
    throw new AuthorizationError("Admin required");
  }
  // Admin logic
});

// Custom errors
throw new AppError("Email exists", 409, "DUPLICATE_EMAIL");
```

**Error Classes:** `AppError`, `NotFoundError`, `AuthenticationError`, `AuthorizationError`, `ConflictError`, `RateLimitError`, `InternalServerError`

## Production Setup

Complete production-ready configuration:

```typescript
import {
  serve,
  use,
  router,
  compose,
  errorHandlerMiddleware,
  bodyParserMiddleware,
  createLoggerMiddleware,
  securityHeadersMiddleware,
  createCompressionMiddleware,
  csrfMiddleware,
  createCorsMiddleware,
  createRateLimiter,
  authMiddleware,
  notFoundMiddleware,
} from "reiatsu";

// 1. Error handling (first!)
use(errorHandlerMiddleware);

// 2. Security
use(securityHeadersMiddleware); // CSP, HSTS, etc.
use(csrfMiddleware); // CSRF protection
use(
  createCorsMiddleware({
    origin: process.env.ALLOWED_ORIGINS?.split(","),
    credentials: true,
  })
);

// 3. Performance
use(createCompressionMiddleware()); // gzip/Brotli
use(createRateLimiter(100, 15 * 60 * 1000)); // Rate limiting

// 4. Request processing
use(bodyParserMiddleware);
use(
  createLoggerMiddleware({
    colorize: process.env.NODE_ENV !== "production",
  })
);

// 5. Routes
const authStack = compose(
  authMiddleware(process.env.JWT_SECRET!),
  createRateLimiter(20, 60 * 1000)
);

router.get("/", (ctx) => ctx.json({ status: "ok" }));
router.post("/api/protected", authStack, protectedHandler);

// 6. 404 handler (last!)
use(notFoundMiddleware);

// 7. Start with graceful shutdown
serve(Number(process.env.PORT) || 3000, {
  onShutdown: async () => {
    console.log("Cleaning up...");
    await db.close();
    cache.clear();
  },
});
```

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=https://app.com,https://api.app.com
```

## All Exports

```typescript
// Core
export { serve, setupGracefulShutdown, router, use, compose, Context };

// Middleware
export {
  bodyParserMiddleware,
  errorHandlerMiddleware,
  notFoundMiddleware,
  authMiddleware,
  createCorsMiddleware,
  corsPresets,
  createRateLimiter,
  createLoggerMiddleware,
  devLoggerMiddleware,
  createRequestIdMiddleware,
  createRequestSizeLimiter,
  createTimeoutMiddleware,
  securityHeadersMiddleware,
  createSecurityHeadersMiddleware,
  csrfMiddleware,
  createCSRFMiddleware,
  createCompressionMiddleware,
  cache,
  serveStatic,
  uploadMiddleware,
  downloadHelperMiddleware,
};

// Security & Validation
export {
  escapeHtml,
  sanitizeFilename,
  sanitizeUrl,
  stripHtml,
  StringValidator,
  NumberValidator,
  ObjectValidator,
  ArrayValidator,
};

// Authentication
export { signJWT, decodeJWT };

// Error Classes
export {
  AppError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  RateLimitError,
  InternalServerError,
};

// Types
export type {
  Handler,
  Middleware,
  CompressionOptions,
  CSRFOptions,
  SecurityHeadersOptions,
};
```

## License

[MIT License](./LICENSE) - Built with ❤️ using pure Node.js (zero dependencies!)

---

**Made for developers who value simplicity, type safety, and zero bloat.**
