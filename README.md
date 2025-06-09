# Reiatsu

![npm](https://img.shields.io/npm/v/reiatsu)
![npm](https://img.shields.io/npm/dm/reiatsu)
![GitHub stars](https://img.shields.io/github/stars/atharvdange618/reiatsu?style=flat-square&color=ff69b4)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-ff69b4?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-First-ff69b4?style=flat-square)

A minimal, type-safe HTTP server framework for Node.js, built from first principles using only Node.js core modules. Reiatsu is designed for simplicity, performance, and modern web development no dependencies, fully typed, and production-ready.

---

## 🚀 Installation

Install Reiatsu from npm:

```bash
npm i reiatsu
```

---

## ✨ Features

- **Pure Node.js HTTP**: Built on Node.js's `http` module for maximum performance
- **Zero Dependencies**: No external packages just Node.js
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
import { router, serve } from "reiatsu";

router.get("/", (ctx) => {
  ctx.status(200).json({ message: "Hello, World!" });
});

serve(3000);
```

---

## 🧩 Middleware Example

```typescript
import { use, router } from "reiatsu";
import {
  createLoggerMiddleware,
  corsPresets,
  errorHandlerMiddleware,
  bodyParserMiddleware,
} from "reiatsu";

// Global error handling
use(errorHandlerMiddleware);

// Request parsing
use(bodyParserMiddleware);

// Logging with custom options
use(
  createLoggerMiddleware({
    logHeaders: true,
    logBody: true,
    colorize: process.env.NODE_ENV !== "production",
  })
);

// CORS configuration
use(corsPresets.development());

// Route-specific middleware
router.post("/upload", uploadMiddleware({ dest: "uploads/" }), async (ctx) => {
  // Handle file upload
});
```

---

## 📖 API Reference

### Context Class

Every route handler receives an instance of the `Context` class with typed route parameters and helpers:

```typescript
class Context<TParams extends Record<string, string> = {}> {
  // Core properties
  req: IncomingMessage;
  res: ServerResponse;
  params: TParams;
  query?: QueryParams;
  body?: any;
  isAuthenticated: boolean;

  // Request Properties & Methods
  get(name: string): string | undefined; // Get request header
  header(name: string): string | undefined; // Alias for get()
  hasHeader(name: string): boolean; // Check header exists
  is(type: string): boolean; // Check content type

  // Request Property Getters
  get ip(): string; // Client IP address
  get protocol(): string; // 'http' or 'https'
  get secure(): boolean; // true if HTTPS
  get hostname(): string; // Host without port
  get subdomains(): string[]; // Subdomain array
  get cookies(): Record<string, string>; // Parsed cookies
  get path(): string; // Request path
  get originalUrl(): string; // Full request URL
  get method(): string; // HTTP method

  // Response Methods
  status(code: number): this; // Set status (chainable)
  send(body: any, type?: string): void; // Send response
  json(data: any): void; // Send JSON response
  text(body: string): void; // Send plain text
  html(body: string): void; // Send HTML
  xml(body: string): void; // Send XML
  redirect(url: string, status?: number): void; // HTTP redirect

  // Special Response Helpers
  cookie(name: string, value: string, options?: CookieOptions): void;
  download(filePath: string, filename?: string): void;
  render(templateStr: string, data?: Record<string, any>): void;
  renderFile(filePath: string, data?: Record<string, any>): void;
}
```

---

## 🛡️ Built-in Middleware

- **CORS** (`corsPresets`, `createCorsMiddleware`)
- **Rate Limiting** (`createRateLimiter`)
- **Request Logging** (`loggerMiddleware`, `devLoggerMiddleware`, `createLoggerMiddleware`)
- **Static File Serving** (`serveStatic`)
- **Cache Middleware** (`cache`)
- **Security Headers** (`createSecurityHeadersMiddleware`)
- **Request Size & Timeout** (`createRequestSizeLimiter`, `createTimeoutMiddleware`)
- **Body Parsing** (`bodyParserMiddleware`)
- **Error Handling** (`errorHandlerMiddleware`)
- **Request ID** (`createRequestIdMiddleware`)
- **Authentication** (`authMiddleware`)
- **Download Helper** (`downloadHelperMiddleware`)

Example usage:

```typescript
import {
  use,
  corsPresets,
  serveStatic,
  bodyParserMiddleware,
  errorHandlerMiddleware,
  createLoggerMiddleware,
  createSecurityHeadersMiddleware,
} from "reiatsu";

// Basic middleware setup
use(bodyParserMiddleware);
use(errorHandlerMiddleware);
use(serveStatic("public"));
use(createSecurityHeadersMiddleware());

// CORS configuration
use(corsPresets.development()); // For development
use(corsPresets.production(["https://myapp.com"])); // For production

// Custom logger setup
use(
  createLoggerMiddleware({
    logHeaders: true,
    logBody: true,
    colorize: process.env.NODE_ENV !== "production",
  })
);
```

---

## 📦 File Upload & Download

**Upload:**

```typescript
import { uploadMiddleware } from "reiatsu";

router.post("/upload", uploadMiddleware({ dest: "uploads/" }), async (ctx) => {
  if (!ctx.files || ctx.files.length === 0) {
    return ctx.status(400).json({ error: "No files uploaded" });
  }
  ctx.json({
    message: "Files uploaded successfully",
    files: ctx.files,
    fields: ctx.body,
  });
});
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

Reiatsu provides a powerful, type-safe validation system with composable validators:

```typescript
import {
  StringValidator,
  NumberValidator,
  ObjectValidator,
  ArrayValidator,
} from "reiatsu";

// Define a user validator
const userValidator = new ObjectValidator({
  name: new StringValidator()
    .required()
    .min(2, "Name must be at least 2 characters"),
  email: new StringValidator().required().email("Invalid email address"),
  age: new NumberValidator()
    .min(0, "Age must be positive")
    .max(120, "Age must be realistic"),
  hobbies: new ArrayValidator(new StringValidator().min(2)),
});

router.post("/users", async (ctx) => {
  const result = await userValidator.validate(ctx.body);
  if (result.error) {
    return ctx.status(400).json({ errors: result.error });
  }
  // result.value contains the validated data
  const user = result.value;
  ctx.json({ message: "User created", user });
});
```

---

## 🔐 Authentication & Authorization

Reiatsu provides built-in JWT authentication middleware and helpers for securing routes and managing user sessions.

**Using Authentication Middleware:**

```typescript
import { authMiddleware, signJWT, decodeJWT } from "reiatsu";

// Protect all routes below this middleware
use(authMiddleware(process.env.JWT_SECRET));

// Protected route: ctx.user and ctx.isAuthenticated will be set
router.get("/profile", (ctx) => {
  if (!ctx.isAuthenticated) {
    return ctx.status(401).json({ error: "Unauthorized" });
  }
  ctx.json({ user: ctx.user });
});
```

**Working with JWTs:**

```typescript
import { signJWT, decodeJWT } from "reiatsu";

// Sign a JWT
const token = signJWT(
  { userId: "123", email: "user@example.com" },
  process.env.JWT_SECRET,
  "1h" // expires in 1 hour
);

// Verify and decode a JWT
const payload = decodeJWT(token, process.env.JWT_SECRET);
```

**Per-Route Authentication:**

```typescript
import { authMiddleware } from "reiatsu";

// Protect a specific route
router.get("/admin", authMiddleware(process.env.JWT_SECRET), (ctx) => {
  // Will only reach here if token is valid
  ctx.json({
    message: "Welcome, admin!",
    user: ctx.user,
  });
});
```

- `ctx.user` is automatically populated if the JWT is valid.

---

## 🛠️ Error Handling

Reiatsu provides a robust error handling system with custom error classes and centralized error handling middleware.

```typescript
import { errorHandlerMiddleware, AppError } from "reiatsu";

// Global error handling
use(errorHandlerMiddleware);

// Custom error handling
router.get("/items/:id", (ctx) => {
  const item = items.find((i) => i.id === ctx.params.id);
  if (!item) {
    throw new AppError("Item not found", 404, "ITEM_NOT_FOUND");
  }
  ctx.json(item);
});
```

Error responses include:

- HTTP status code
- Error message
- Error code
- Request details (in development)
- Stack trace (in development)

---

## 📝 Template Rendering

Built-in template engine with EJS-like syntax:

```typescript
// Render a template string
router.get("/hello", (ctx) => {
  ctx.render("Hello, <%= name %>!", { name: "World" });
});

// Render a template file
router.get("/page", (ctx) => {
  ctx.renderFile("templates/page.html", {
    title: "Welcome",
    user: ctx.user,
  });
});
```

The template engine supports:

- EJS-like syntax (<%= %> for values)
- Includes and partials
- HTML escaping
- Custom template paths

---

## 📦 Exports Reference

### Core Exports

```typescript
import {
  // Server & Router
  serve, // Start the HTTP server
  router, // Router instance
  use, // Add global middleware

  // Context
  Context, // Base context class

  // Types
  Handler, // Route handler type
  Middleware, // Middleware type
} from "reiatsu";
```

### Middleware Exports

```typescript
import {
  // Authentication & Security
  authMiddleware,
  createSecurityHeadersMiddleware,

  // Request Processing
  bodyParserMiddleware,
  createRequestSizeLimiter,
  createTimeoutMiddleware,

  // Logging & Monitoring
  createLoggerMiddleware,
  devLoggerMiddleware,
  createRequestIdMiddleware,

  // CORS & Cache
  corsPresets,
  createCorsMiddleware,
  cache,

  // File Handling
  serveStatic,
  uploadMiddleware,
  downloadHelperMiddleware,

  // Error Handling
  errorHandlerMiddleware,
} from "reiatsu";
```

### Utility Exports

```typescript
import {
  // Authentication
  signJWT,
  decodeJWT,

  // Validation
  BaseValidator,
  StringValidator,
  NumberValidator,
  ObjectValidator,
  ArrayValidator,
  ValidationResult,
  ValidationError,

  // Error Classes
  AppError,

  // Helper Functions
  asyncHandler,
  bufferRequest,
  parseCookie,

  // File Operations
  saveFileToDisk,
  parseMultipartFormData,
} from "reiatsu";
```

### Type Examples

```typescript
// Route Handler Type: Automatically infers params from route path
type Handler<Path extends string> = (
  ctx: Context<ExtractRouteParams<Path>>
) => Promise<void> | void;

// Middleware Type: Can extend Context for custom properties
type Middleware<Ctx extends Context = Context> = (
  ctx: Ctx,
  next: () => Promise<void> | void
) => Promise<void> | void;

// Cookie Options Type
interface CookieOptions {
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

// CORS Configuration
interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}
```

---

## 🏗️ Production Deployment

Reiatsu is production-ready with comprehensive environment configuration:

```bash
# Required environment variables
NODE_ENV=production        # Enables production optimizations
PORT=3000                 # Server port
JWT_SECRET=your-secret    # JWT signing key

# Optional configuration
ALLOWED_ORIGINS=https://myapp.com,https://api.myapp.com
LOG_LEVEL=info           # Logging verbosity
TRUST_PROXY=true        # Trust X-Forwarded-* headers
MAX_REQUEST_SIZE=5mb    # Request size limit
REQUEST_TIMEOUT=30000   # Request timeout in ms
RATE_LIMIT=100         # Requests per minute per IP
```

Production best practices:

- Set appropriate CORS origins
- Enable rate limiting
- Configure security headers
- Set up request size limits
- Enable request timeouts
- Use TLS in production
- Configure logging appropriately

---

## 🤝 Contributing

Contributions are welcome! Please fork, create a feature branch, write tests, and submit a pull request.

---

## 📄 License

MIT License. Built with ❤️ using pure Node.js and TypeScript.
