# Sage

A minimal TypeScript HTTP server framework, built from first principles.

Sage is designed to be a lightweight and understandable framework for building
HTTP servers in Node.js without external dependencies like Express or Fastify.

## ✨ Goals

Sage aims to provide the following core features:

- **Pure Node.js HTTP:** Leveraging Node.js's built-in `http` module for core server functionality.
- **Router with Dynamic Route Matching:** Support for defining routes with dynamic parameters (e.g., `/user/:id`).
- **Expressive Routing API:** Use `router.get(...)`, `router.post(...)`, etc. for clean route registration.
- **Support for All HTTP Methods:** Built-in handling for `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, and `HEAD`.
- **Middleware System:** Global and per-route middleware support with a flexible execution engine.
- **Request Body Parsing:** Built-in JSON body parser (URL-encoded support planned).
- **Typed Handler Functions:** Strong typing for route handler functions, including a context object (`ctx`) with `req`, `res`, `params`, and helpers.
- **Composable Structure:** Modular architecture with separation of concerns between core logic, routes, and handlers.
- **Extensible:** Designed to be extended with custom middleware and features (e.g., CORS, static file serving, logging, validation).

## 🗂️ Project Structure

The initial project structure is organized as follows:

```

Sage/
├── src/
│ ├── core/
│ │ ├── server.ts # Server bootstrap (low-level HTTP handling)
│ │ ├── router.ts # Routing logic and route matching
│ │ └── middleware.ts # Middleware execution engine
│ ├── types/
│ │ └── http.ts # TypeScript types for requests, responses, context, etc.
│ ├── handlers/
│ │ └── helloHandler.ts # Sample route handler
│ ├── routes/
│ │ └── index.ts # Central place for defining application routes
│ └── index.ts # Entry point to the Sage framework
├── tests/
│ └── server.test.ts # Basic integration tests
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started (Planned)

Details on how to install, run, and extend Sage will be added once the framework stabilizes

## 🧪 Testing

All HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD) are supported and tested using Bruno.

More automated testing with Vitest and Supertest is planned.

## 🤝 Contributing (Planned)

Information on how to contribute to the Sage project will be added here.

## 📄 License (Planned)

Information about the project's license will be added here.
