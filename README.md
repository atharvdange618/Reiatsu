# Reiatsu

A minimal, type-safe HTTP server framework for Node.js, built from first principles using only Node.js core modules. Reiatsu is designed for simplicity, performance, and modern web development—no dependencies, fully typed, and production-ready.

---

## 🚀 Installation

Install Reiatsu from npm:

```bash
npm i reiatsu
```

---

## ✨ Features

- **Pure Node.js HTTP**: Built on Node.js's `http` module for maximum performance
- **Zero Dependencies**: No external packages—just Node.js
- **TypeScript First**: Fully typed, with comprehensive TypeScript support
- **Advanced Routing**: Dynamic, parameterized, and wildcard routes
- **Flexible Middleware**: Global and per-route, with async/await support
- **Request/Response Helpers**: Modern, chainable helpers for clean handler logic
- **Built-in Middleware**: CORS, rate limiting, logging, security headers, static file serving, body parsing, and more
- **Security & Error Handling**: Centralized error handling, custom error classes, request ID tracking, and input validation
- **Production Ready**: Environment-specific optimizations, security best practices, and detailed logging

---

## 🛣️ Quick Start

```typescript
import { router } from "reiatsu/core/router";
import { serve } from "reiatsu/core/server";

router.get("/", (ctx) => {
  ctx.status(200).json({ message: "Hello, World!" });
});

serve(3000);
```

---

## 🧩 Middleware Example

```typescript
import { use } from "reiatsu/core/router";
import { loggerMiddleware } from "reiatsu/middleware/logger";
import { corsMiddleware } from "reiatsu/middleware/cors";

use(loggerMiddleware);
use(corsMiddleware);
```

---

## 📖 API Reference

### Context Object

Every route handler receives a `Context` object with helpers and request data:

```typescript
interface Context {
  req: IncomingMessage;
  res: ServerResponse;
  params: RouteParams;
  body?: any;
  query?: QueryParams;
  requestId?: string;
  // Response helpers
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
  // Request helpers
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

---

## 🛡️ Built-in Middleware

- **CORS**
- **Rate Limiting**
- **Request Logging**
- **Static File Serving**
- **Cache Middleware**
- **Security Headers**
- **Request Size & Timeout**

Example usage:

```typescript
import { use } from "reiatsu/core/router";
import { corsPresets } from "reiatsu/middleware/cors";

use(corsPresets.development());
use(corsPresets.production(["https://myapp.com"]));
```

---

## 📦 File Upload & Download

**Upload:**
```typescript
import { uploadMiddleware } from "reiatsu/middleware/upload";

router.post(
  "/upload",
  uploadMiddleware({ dest: "uploads/" }),
  async (ctx) => {
    if (!ctx.files || ctx.files.length === 0) {
      return ctx.status(400).json({ error: "No files uploaded" });
    }
    ctx.json({
      message: "Files uploaded successfully",
      files: ctx.files,
      fields: ctx.body,
    });
  }
);
```

**Download:**
```typescript
router.get("/download/:filename", async (ctx) => {
  let filePath = (ctx.query && ctx.query.path) || (ctx.body && ctx.body.path);
  if (!filePath) {
    filePath = `uploads/${ctx.params.filename}`;
  }
  ctx.download(filePath);
});
```

---

## 🧪 Input Validation

```typescript
import { Validator } from "reiatsu/utils/validation";

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

---

## 🏗️ Production Deployment

Set environment variables:

```bash
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://myapp.com,https://api.myapp.com
```

---

## 📋 Roadmap

- [ ] WebSocket support
- [ ] Built-in caching layer
- [ ] Database utilities
- [ ] Session management
- [ ] Template engine integration
- [ ] API documentation generation
- [ ] Performance monitoring
- [ ] Health check endpoints

---

## 🤝 Contributing

Contributions are welcome! Please fork, create a feature branch, write tests, and submit a pull request.

---

## 📄 License

MIT License. Built with ❤️ using pure Node.js and TypeScript.
