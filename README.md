# Sage

A minimal TypeScript HTTP server framework, built from first principles.

Sage is designed to be a lightweight and understandable framework for building
HTTP servers in Node.js without external dependencies like Express or Fastify.

## ✨ Goals

Sage aims to provide the following core features:

- **Pure Node.js HTTP:** Leveraging Node.js's built-in `http` module for core server
  functionality.
- **Router with Dynamic Route Matching:** Support for defining routes with dynamic
  parameters (e.g., `/user/:id`).
- **Middleware System:** A flexible system for processing requests and responses
  through a chain of functions.
- **Request Body Parsing:** Built-in support for parsing common request body
  types like JSON and URL-encoded.
- **Typed Handler Functions:** Strong typing for route handler functions,
  including a context object for request and response data.
- **Composable Structure:** Encouraging a modular approach to building applications
  with separate files for servers, routes, and handlers.
- **Extensible:** Designed to be easy to extend with custom middleware and
  functionality (e.g., CORS, serving static files).

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

Details on how to install, set up, and run Sage will be added here once the
initial development is complete.

## 🤝 Contributing (Planned)

Information on how to contribute to the Sage project will be added here.

## 📄 License (Planned)

Information about the project's license will be added here.
