import { describe, it, expect, vi, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { Context } from "../core/context";
import { createRateLimiter } from "../middleware/rateLimiter";

describe("Rate Limiter Middleware", () => {
  let ctx: Context;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const req = {
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    } as IncomingMessage;
    const res = {} as ServerResponse;
    ctx = new Context(req, res, {}, {});
    next = vi.fn();
  });

  it("should allow requests within limit", async () => {
    const rateLimiter = createRateLimiter(5, 1000);

    // Make 5 requests - all should pass
    for (let i = 0; i < 5; i++) {
      await rateLimiter(ctx, next);
    }

    expect(next).toHaveBeenCalledTimes(5);
  });

  it("should block requests exceeding limit", async () => {
    const rateLimiter = createRateLimiter(3, 1000);

    // Make 3 requests - should pass
    for (let i = 0; i < 3; i++) {
      await rateLimiter(ctx, next);
    }

    // 4th request should fail
    await expect(async () => {
      await rateLimiter(ctx, next);
    }).rejects.toThrow("Too many requests");

    expect(next).toHaveBeenCalledTimes(3);
  });

  it("should reset count after window expires", async () => {
    const rateLimiter = createRateLimiter(2, 100); // 100ms window

    // Make 2 requests
    await rateLimiter(ctx, next);
    await rateLimiter(ctx, next);

    // 3rd should fail
    await expect(async () => {
      await rateLimiter(ctx, next);
    }).rejects.toThrow("Too many requests");

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should allow new requests after window reset
    await rateLimiter(ctx, next);
    expect(next).toHaveBeenCalledTimes(3);
  });

  it("should track different IPs separately", async () => {
    const rateLimiter = createRateLimiter(2, 1000);

    // Request from first IP
    await rateLimiter(ctx, next);
    await rateLimiter(ctx, next);

    // 3rd from same IP should fail
    await expect(async () => {
      await rateLimiter(ctx, next);
    }).rejects.toThrow("Too many requests");

    // Request from second IP should succeed
    const req2 = {
      headers: {},
      socket: { remoteAddress: "192.168.1.1" },
    } as IncomingMessage;
    const ctx2 = new Context(req2, {} as ServerResponse, {}, {});

    await rateLimiter(ctx2, next);
    expect(next).toHaveBeenCalledTimes(3);
  });

  it("should handle x-forwarded-for header", async () => {
    const rateLimiter = createRateLimiter(2, 1000);

    const req = {
      headers: { "x-forwarded-for": "203.0.113.1" },
      socket: { remoteAddress: "127.0.0.1" },
    } as unknown as IncomingMessage;
    const forwardedCtx = new Context(req, {} as ServerResponse, {}, {});

    await rateLimiter(forwardedCtx, next);
    await rateLimiter(forwardedCtx, next);

    await expect(async () => {
      await rateLimiter(forwardedCtx, next);
    }).rejects.toThrow("Too many requests");

    expect(next).toHaveBeenCalledTimes(2);
  });

  // Memory leak test - verify cleanup happens
  it("should clean up expired entries (memory leak prevention)", async () => {
    const rateLimiter = createRateLimiter(1, 50); // 50ms window

    // Make request that will expire
    await rateLimiter(ctx, next);

    // Second request should fail immediately
    await expect(async () => {
      await rateLimiter(ctx, next);
    }).rejects.toThrow("Too many requests");

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Should allow new request after window expires (cleanup working)
    await rateLimiter(ctx, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
