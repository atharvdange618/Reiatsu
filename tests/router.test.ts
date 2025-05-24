import { router, compileRoute } from "../src/core/router";
import { Context } from "../src/types/http";

// Mock handlers for testing
const mockHandler = (name: string) => (ctx: Context) => {
  console.log(`Handler ${name} called with params:`, ctx.params);
};

// Basic parameter routes
router.get("/users/:id", mockHandler("user-by-id"));
router.get("/users/:id/posts/:postId", mockHandler("user-post"));

// Regex constraint routes
router.get("/api/v:version(\\d+)/users", mockHandler("versioned-api"));
router.get("/products/:sku([A-Z]{2}\\d{4})", mockHandler("product-by-sku"));
router.get("/dates/:date(\\d{4}-\\d{2}-\\d{2})", mockHandler("date-route"));

// Wildcard routes
router.get("/files/*", mockHandler("file-wildcard"));
router.get("/static/*", mockHandler("static-assets"));

// Mixed patterns
router.get("/api/v:version(\\d+)/files/*", mockHandler("versioned-files"));

// Test cases
const testCases = [
  // Basic parameter tests
  { method: "GET", url: "/users/123", expected: { id: "123" } },
  { method: "GET", url: "/users/abc", expected: { id: "abc" } },
  {
    method: "GET",
    url: "/users/123/posts/456",
    expected: { id: "123", postId: "456" },
  },

  // Regex constraint tests - should match
  { method: "GET", url: "/api/v1/users", expected: { version: "1" } },
  { method: "GET", url: "/api/v42/users", expected: { version: "42" } },
  { method: "GET", url: "/products/AB1234", expected: { sku: "AB1234" } },
  { method: "GET", url: "/dates/2024-12-25", expected: { date: "2024-12-25" } },

  // Regex constraint tests - should fail (404)
  { method: "GET", url: "/api/vbeta/users", expected: null },
  { method: "GET", url: "/api/v1.2/users", expected: null },
  { method: "GET", url: "/products/123ABC", expected: null },
  { method: "GET", url: "/products/A1234", expected: null },
  { method: "GET", url: "/dates/2024-13-45", expected: null },
  { method: "GET", url: "/dates/24-12-25", expected: null },

  // Wildcard tests
  {
    method: "GET",
    url: "/files/docs/readme.txt",
    expected: { wildcard: "docs/readme.txt" },
  },
  {
    method: "GET",
    url: "/files/images/logo.png",
    expected: { wildcard: "images/logo.png" },
  },
  {
    method: "GET",
    url: "/static/css/main.css",
    expected: { wildcard: "css/main.css" },
  },

  // Mixed pattern tests
  {
    method: "GET",
    url: "/api/v2/files/uploads/photo.jpg",
    expected: { version: "2", wildcard: "uploads/photo.jpg" },
  },

  // Edge cases
  { method: "GET", url: "/users/", expected: null }, // Missing required param
  { method: "GET", url: "/users/123/posts/", expected: null }, // Missing required param
  { method: "POST", url: "/users/123", expected: null }, // Wrong method
  { method: "GET", url: "/nonexistent", expected: null }, // No matching route
];

// Mock HTTP objects for testing
function createMockRequest(method: string, url: string) {
  return {
    method,
    url,
    headers: { host: "localhost:3000" },
  } as any;
}

function createMockResponse() {
  let statusCode = 200;
  let headers: Record<string, string> = {};
  let body = "";
  let headersSent = false;

  return {
    writeHead: (code: number, hdrs?: Record<string, string>) => {
      statusCode = code;
      if (hdrs) headers = { ...headers, ...hdrs };
      headersSent = true;
    },
    end: (data?: string) => {
      if (data) body = data;
    },
    get headersSent() {
      return headersSent;
    },
    getStatus: () => statusCode,
    getBody: () => body,
  } as any;
}

console.log("Running pattern matching tests...\n");

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const req = createMockRequest(testCase.method, testCase.url);
    const res = createMockResponse();

    console.log(`Testing: ${testCase.method} ${testCase.url}`);

    try {
      await router.handle(req, res);

      if (testCase.expected === null) {
        // Should be 404
        if (res.getStatus() === 404) {
          console.log("✅ Expected 404 - PASS\n");
          passed++;
        } else {
          console.log(`❌ Expected 404, got ${res.getStatus()} - FAIL\n`);
          failed++;
        }
      } else {
        // Should match and extract params
        if (res.getStatus() === 200) {
          console.log("✅ Route matched - PASS");
          console.log(`Expected params:`, testCase.expected);
          console.log(""); // Extra newline for readability
          passed++;
        } else {
          console.log(`❌ Expected match, got ${res.getStatus()} - FAIL\n`);
          failed++;
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error} - FAIL\n`);
      failed++;
    }
  }

  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log(
    `Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`
  );
}

// Additional pattern compilation tests
console.log("\n=== Pattern Compilation Debug ===");
const debugPatterns = [
  "/users/:id",
  "/api/v:version(\\d+)/users",
  "/files/*",
  "/products/:sku([A-Z]{2}\\d{4})",
  "/api/v:version(\\d+)/files/*",
];

console.log("Pattern compilation results:");
debugPatterns.forEach((pattern) => {
  const compiled = compileRoute(pattern);
  console.log(`Pattern: ${pattern}`);
  console.log(`Regex: ${compiled.regex}`);
  console.log(`Params: ${compiled.paramNames.join(", ")}`);
  console.log(`Has wildcard: ${compiled.hasWildcard}\n`);
});

runTests();
