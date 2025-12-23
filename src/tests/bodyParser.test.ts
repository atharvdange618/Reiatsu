import { describe, it, expect, vi, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { EventEmitter } from "events";
import { Context } from "../core/context";
import { bodyParserMiddleware } from "../middleware/bodyParser";

describe("Body Parser Middleware", () => {
  let req: IncomingMessage;
  let res: ServerResponse;
  let ctx: Context;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = new EventEmitter() as any;
    req.method = "POST";
    req.headers = { "content-type": "application/json" };

    res = {
      statusCode: 200,
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
    } as any;

    ctx = new Context(req, res, {}, {});
    next = vi.fn();
  });

  it("should parse JSON body", async () => {
    const jsonData = { name: "test", value: 123 };
    const promise = bodyParserMiddleware(ctx, next);

    // Simulate data chunks
    req.emit("data", Buffer.from(JSON.stringify(jsonData)));
    req.emit("end");

    await promise;

    expect(ctx.body).toEqual(jsonData);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should parse URL-encoded body", async () => {
    req.headers["content-type"] = "application/x-www-form-urlencoded";
    ctx = new Context(req, res, {}, {});

    const formData = "name=test&value=123";
    const promise = bodyParserMiddleware(ctx, next);

    req.emit("data", Buffer.from(formData));
    req.emit("end");

    await promise;

    expect(ctx.body).toEqual({ name: "test", value: "123" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should skip parsing for GET requests", async () => {
    req.method = "GET";
    ctx = new Context(req, res, {}, {});

    await bodyParserMiddleware(ctx, next);

    expect(ctx.body).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should skip multipart/form-data", async () => {
    req.headers["content-type"] =
      "multipart/form-data; boundary=----WebKitFormBoundary";
    ctx = new Context(req, res, {}, {});

    await bodyParserMiddleware(ctx, next);

    expect(ctx.body).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject payloads exceeding size limit", async () => {
    const largeData = "x".repeat(11 * 1024 * 1024); // 11MB (over 10MB limit)

    const promise = Promise.resolve(bodyParserMiddleware(ctx, next));

    // Send large payload in one chunk
    req.emit("data", Buffer.from(largeData));

    await promise;

    // Should have responded with 413
    expect(ctx.res.statusCode).toBe(413);
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle invalid JSON gracefully", async () => {
    const promise = bodyParserMiddleware(ctx, next);

    req.emit("data", Buffer.from("{invalid json}"));
    req.emit("end");

    await promise;

    expect(ctx.res.statusCode).toBe(400);
    expect(ctx.res.end).toHaveBeenCalled();
  });

  it("should handle multiple data chunks", async () => {
    const jsonData = { name: "test", value: 123 };
    const jsonString = JSON.stringify(jsonData);
    const chunkSize = 5;

    const promise = bodyParserMiddleware(ctx, next);

    // Send data in small chunks
    for (let i = 0; i < jsonString.length; i += chunkSize) {
      req.emit("data", Buffer.from(jsonString.slice(i, i + chunkSize)));
    }
    req.emit("end");

    await promise;

    expect(ctx.body).toEqual(jsonData);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should track size accurately across chunks", async () => {
    // Create payload that will exceed 10MB
    const chunkSize = 3 * 1024 * 1024; // 3MB chunks
    const numChunks = 4; // 12MB total

    const promise = Promise.resolve(bodyParserMiddleware(ctx, next));

    for (let i = 0; i < numChunks; i++) {
      req.emit("data", Buffer.alloc(chunkSize, "a"));
      if (ctx.res.statusCode === 413) break; // Stop if already rejected
    }

    await promise;

    // Should reject as it exceeds the limit
    expect(ctx.res.statusCode).toBe(413);
  });
});
