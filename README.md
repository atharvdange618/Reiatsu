# Sage

A minimal, type-safe HTTP server framework built from first principles using pure Node.js.

Sage is designed to be a lightweight, understandable, and production-ready framework for building HTTP servers in Node.js **without any external dependencies**. Built entirely using Node.js built-in modules, Sage provides everything you need for modern web application development while maintaining simplicity and performance.

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
- **Request/Response Helpers**: Built-in JSON responses, status codes, and redirects
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

- **Hot Reloading Ready**: Works seamlessly with development tools
- **Detailed Logging**: Request/response logging with colorized output for development
- **Environment Detection**: Automatic development vs production behavior
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Extensible Architecture**: Easy to extend with custom middleware and features

## 🗂️ Project Structure

```
Sage/
├── src/
│   ├── core/
│   │   ├── server.ts          # HTTP server bootstrap
│   │   ├── router.ts          # Route matching and handling
│   │   └── middleware.ts      # Middleware execution engine
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── bodyParser.ts     # Request body parsing
│   │   ├── cors.ts           # CORS handling with presets
│   │   ├── errorHandler.ts   # Centralized error handling
│   │   ├── logger.ts         # Request/response logging
│   │   ├── rateLimiter.ts    # Rate limiting protection
│   │   ├── requestId.ts      # Request ID generation
│   │   ├── security.ts       # Security headers
│   │   ├── static.ts         # Static file serving
│   │   └── responseHelpers.ts # Response utilities
│   ├── types/
│   │   └── http.ts           # TypeScript type definitions
│   ├── errors/
│   │   └── AppError.ts       # Custom error classes
│   ├── utils/
│   │   ├── validation.ts     # Input validation utilities
│   │   ├── mime.ts          # MIME type detection
│   │   └── asyncHandler.ts   # Async error handling wrapper
│   ├── handlers/
│   │   ├── userHandler.ts    # Example user CRUD handlers
│   │   ├── helloHandler.ts   # Basic route handlers
│   │   └── ...               # Additional route handlers
│   ├── routes/
│   │   └── index.ts          # Route definitions
│   └── index.ts              # Framework entry point
├── public/                   # Static files directory
├── tests/
│   └── server.test.ts       # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/atharvdange618/Sage.git
cd Sage
npm install
```

### Basic Usage

```typescript
import { router } from "./src/core/router";
import { startServer } from "./src/core/server";

// Define routes
router.get("/", (ctx) => {
  ctx.status?.(200).json?.({ message: "Hello, World!" });
});

router.get("/user/:id", (ctx) => {
  const { id } = ctx.params;
  ctx.status?.(200).json?.({ userId: id });
});

router.post("/users", (ctx) => {
  const userData = ctx.body;
  ctx.status?.(201).json?.({
    message: "User created",
    data: userData,
  });
});

// Start server
startServer(3000);
```

### Middleware Usage

```typescript
import { use } from "./src/core/router";
import { loggerMiddleware } from "./src/middleware/logger";
import { corsMiddleware } from "./src/middleware/cors";

// Global middleware
use(loggerMiddleware);
use(corsMiddleware);

// Route-specific middleware
router.get("/protected", authMiddleware, (ctx) => {
  ctx.status?.(200).json?.({ message: "Protected route" });
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
  req: IncomingMessage; // Raw Node.js request
  res: ServerResponse; // Raw Node.js response
  params: RouteParams; // Route parameters (/user/:id)
  body?: any; // Parsed request body
  query?: QueryParams; // URL query parameters
  requestId?: string; // Unique request identifier
  status?: (code: number) => Context; // Set status code
  json?: (data: unknown) => void; // Send JSON response
  redirect?: (url: string, status?: number) => void; // Redirect
}
```

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

// Development preset (allows all origins)
use(corsPresets.development());

// Production preset (specific origins)
use(corsPresets.production(["https://myapp.com"]));

// Custom configuration
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

// 100 requests per 15 minutes
use(createRateLimiter(100, 15 * 60 * 1000));
```

### Request Logging

```typescript
import {
  createLoggerMiddleware,
  devLoggerMiddleware,
} from "./src/middleware/logger";

// Development logging (verbose)
use(devLoggerMiddleware);

// Production logging (minimal)
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

// Serve files from 'public' directory at '/static/*'
use(serveStatic("public"));
```

## 🔍 Error Handling

Sage provides structured error handling with custom error classes:

```typescript
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
} from "./src/errors/AppError";

// In route handlers
router.post("/users", async (ctx) => {
  if (!ctx.body.email) {
    throw new ValidationError("Email is required");
  }

  if (userNotFound) {
    throw new NotFoundError("User");
  }

  // Errors are automatically caught and formatted
});
```

## 🧪 Input Validation

Built-in validation utilities:

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

- **Automatic Security Headers**: XSS protection, content type options, frame options
- **Request Rate Limiting**: Configurable rate limiting per IP
- **Request Size Limiting**: Protection against large payloads
- **Request Timeouts**: Automatic timeout handling
- **Structured Logging**: JSON-formatted logs for production monitoring
- **Error Sanitization**: Sensitive error details hidden in production

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

## 📊 Why Sage?

- **Educational**: Perfect for understanding HTTP server internals
- **Lightweight**: Zero dependencies, minimal overhead
- **Type-Safe**: Full TypeScript support out of the box
- **Production-Ready**: Includes all necessary middleware for real applications
- **Extensible**: Easy to customize and extend
- **Modern**: Uses modern JavaScript/TypeScript features and patterns

## 📄 License

MIT License - feel free to use this project for learning, development, or production applications.

---

Built with ❤️ using pure Node.js and TypeScript
