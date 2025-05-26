# Reiatsu

A minimal, type-safe HTTP server framework built from first principles using pure Node.js.

Reiatsu is designed to be a lightweight, understandable, and production-ready framework for building HTTP servers in Node.js **without any external dependencies**. Built entirely using Node.js built-in modules, Reiatsu provides everything you need for modern web application development while maintaining simplicity and performance.

## ✨ Features

### 🚀 Core Framework

- **Pure Node.js HTTP**: Leveraging Node.js's built-in `http` module for maximum performance
- **Zero Dependencies**: No external packages - only Node.js built-in modules
- **TypeScript First**: Fully typed with comprehensive TypeScript support
- **Production Ready**: Environment-specific configurations and optimizations

### 🛣️ Advanced Routing

- **Dynamic Route Matching**: Support for parameterized routes (e.g., `/user/:id`)
- **Expressive API**: Clean route registration with `router.get()`, `router.post()`, etc.
- **All HTTP Methods**: Built-in support for GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- **Query Parameter Parsing**: Automatic extraction and parsing of URL query parameters
- **Wildcard Routes**: Support for catch-all routes with `*`
- **Semantic Parameter Validation**: Built-in regex enhancements for route parameters, including date constraints that validate `YYYY-MM-DD` ranges (months `01–12`, days `01–31`)

### 🔧 Comprehensive Middleware System

- **Global & Route-Specific**: Flexible middleware execution with proper async/await support
- **Request/Response Helpers**: Built-in methods like `.status()`, `.json()`, `.redirect()` for clean handler logic
- **Body Parsing**: JSON and URL-encoded form data parsing
- **CORS Support**: Configurable CORS with development and production presets
- **Request Logging**: Detailed request/response logging with customizable formats
- **Rate Limiting**: Built-in rate limiting with configurable windows
- **Security Headers**: Automatic security headers (XSS, CSRF, etc.)
- **Request Timeouts**: Configurable request timeout handling
- **Request Size Limiting**: Protection against oversized requests
- **Static File Serving**: Secure static file serving with path traversal protection

### 🔒 Security & Error Handling

- **Custom Error Classes**: Structured error handling with operational error detection
- **Centralized Error Handling**: Automatic error catching and formatting
- **Request ID Tracking**: Unique request IDs for debugging and logging
- **Input Validation**: Built-in validation utilities for common use cases
- **Security Best Practices**: OWASP-compliant security headers and protections

### 🛠️ Developer Experience

- **Detailed Logging**: Request/response logging with colorized output for development
- **Environment Detection**: Automatic development vs production behavior
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Extensible Architecture**: Easy to extend with custom middleware and features
- **Modern Response Helpers**: Chainable and composable helpers (`ctx.status().json()`) for clean and expressive route logic

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/atharvdange618/Reiatsu.git
cd Reiatsu
npm install
```

### Basic Usage

```typescript
import { router } from "./src/core/router";
import { serve } from "./src/core/server";

// Define routes
router.get("/", (ctx) => {
  ctx.status(200).json({ message: "Hello, World!" });
});

router.get("/user/:id", (ctx) => {
  const { id } = ctx.params;
  ctx.status(200).json({ userId: id });
});

router.post("/users", (ctx) => {
  const userData = ctx.body;
  ctx.status(201).json({
    message: "User created",
    data: userData,
  });
});

// Start server
serve(3000);
```

### Middleware Usage

```typescript
import { use } from "./src/core/router";
import { loggerMiddleware } from "./src/middleware/logger";
import { corsMiddleware } from "./src/middleware/cors";
import { cacheMiddleware } from "./src/middleware/cache";

// Global middleware
use(loggerMiddleware);
use(corsMiddleware);

// Per-route cache middleware
router.get("/public-data", cacheMiddleware(60), (ctx) => {
  ctx.status(200).json({ message: "This response is cached for 60 seconds" });
});

// Route-specific middleware
router.get("/protected", authMiddleware, (ctx) => {
  ctx.status(200).json({ message: "Protected route" });
});
```

### Environment Configuration

```bash
# Development
NODE_ENV=development npm start

# Production
NODE_ENV=production npm start
```

## 📖 API Reference

### Context Object

Every route handler receives a `Context` object with the following properties:

```typescript
interface Context {
  req: IncomingMessage;
  res: ServerResponse;
  params: RouteParams;
  body?: any;
  query?: QueryParams;
  requestId?: string;

  // Response Helpers
  status: (code: number) => Context;
  json: (data: unknown) => void;
  send: (body: string | Buffer, type?: string) => void;
  html: (body: string) => void;
  text: (body: string) => void;
  xml: (body: string) => void;
  redirect: (url: string, status?: number) => void;
  cookie: (name: string, value: string, options?: CookieOptions) => void;
  download: (filePath: string, filename?: string) => void;
  render: (template: string, data?: Record<string, any>) => void;
  renderFile: (filePath: string, data?: Record<string, any>) => void;

  // Request Helpers
  get: (name: string) => string | undefined;
  header: (name: string) => string | undefined;
  hasHeader: (name: string) => boolean;
  is: (type: string) => boolean;
  ip: string;
  protocol: string;
  secure: boolean;
  hostname: string;
  subdomains: string[];
  cookies: Record<string, string>;
  path: string;
  originalUrl: string;
  method: string;
}
```

- Response helpers like `status`, `json`, `send`, `html`, `text`, `xml`, `redirect`, `cookie`, `download`, `render`, and `renderFile` simplify crafting responses, including EJS template rendering.
- Request helpers and properties like `get`, `header`, `hasHeader`, `is`, `ip`, `protocol`, `secure`, `hostname`, `subdomains`, `cookies`, `path`, `originalUrl`, and `method` make it easy to inspect and work with incoming requests.

### Router Methods

```typescript
router.get(path, ...middleware, handler);
router.post(path, ...middleware, handler);
router.put(path, ...middleware, handler);
router.delete(path, ...middleware, handler);
router.patch(path, ...middleware, handler);
router.options(path, ...middleware, handler);
router.head(path, ...middleware, handler);
```

### Global Middleware

```typescript
import { use } from "./src/core/router";

use(middlewareFunction);
```

## 🛡️ Built-in Middleware

### CORS

```typescript
import { createCorsMiddleware, corsPresets } from "./src/middleware/cors";

use(corsPresets.development());
use(corsPresets.production(["https://myapp.com"]));
use(
  createCorsMiddleware({
    origin: ["https://trusted-site.com"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### Rate Limiting

```typescript
import { createRateLimiter } from "./src/middleware/rateLimiter";

use(createRateLimiter(100, 15 * 60 * 1000));
```

### Request Logging

```typescript
import {
  createLoggerMiddleware,
  devLoggerMiddleware,
} from "./src/middleware/logger";

use(devLoggerMiddleware);
use(
  createLoggerMiddleware({
    includeRequestId: true,
    logBody: false,
    logHeaders: false,
  })
);
```

### Static File Serving

```typescript
import { serveStatic } from "./src/middleware/static";

use(serveStatic("public"));
```

#### Cache Middleware

```typescript
import { cacheMiddleware } from "./src/middleware/cache";

// Per-route cache for 30 seconds
router.get("/api/data", cacheMiddleware(30), (ctx) => {
  ctx.status(200).json({ data: "Cached data" });
});
```

The `cacheMiddleware(ttlSeconds)` enables per-route caching. Responses are cached for the specified number of seconds (TTL).

## 🔍 Error Handling

```typescript
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
} from "./src/errors/AppError";

router.post("/users", async (ctx) => {
  if (!ctx.body.email) {
    throw new ValidationError("Email is required");
  }

  if (userNotFound) {
    throw new NotFoundError("User");
  }
});
```

## 🧪 Input Validation

```typescript
import { Validator } from "./src/utils/validation";

router.post("/users", (ctx) => {
  const { name, email, age } = ctx.body;

  Validator.required(name, "Name");
  Validator.email(email);
  Validator.minLength(name, 2, "Name");

  if (age) {
    const validAge = Validator.isNumber(age, "Age");
    Validator.range(validAge, 0, 120, "Age");
  }
});
```

## 🚀 Production Deployment

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://myapp.com,https://api.myapp.com
```

### Production Features

- **Automatic Security Headers**
- **Request Rate Limiting**
- **Request Size Limiting**
- **Request Timeouts**
- **Structured Logging**
- **Error Sanitization**

## 📋 Development Roadmap

- [ ] WebSocket support
- [ ] Built-in caching layer
- [ ] Database connection utilities
- [ ] Session management
- [ ] Template engine integration
- [ ] API documentation generation
- [ ] Performance monitoring
- [ ] Health check endpoints

## 🧪 Testing

Testing framework is yet to be implemented.

## 🤝 Contributing

This is a learning project built from first principles. Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure TypeScript types are properly defined
5. Submit a pull request

## 📊 Why Reiatsu?

- **Educational**
- **Lightweight**
- **Type-Safe**
- **Production-Ready**
- **Extensible**
- **Modern**

## 📄 License

MIT License - feel free to use this project for learning, development, or production applications.

---

Built with ❤️ using pure Node.js and TypeScript
