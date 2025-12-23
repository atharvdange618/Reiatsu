import { describe, it, expect, vi, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { Context } from "../core/context";
import { createTimeoutMiddleware } from "../middleware/requestTimeout";

describe("Request Timeout Middleware", () => {
  let ctx: Context;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const req = {} as IncomingMessage;
    const res = {} as ServerResponse;
    ctx = new Context(req, res, {}, {});
    next = vi.fn();
  });

  it("should allow fast requests to complete", async () => {
    const timeoutMiddleware = createTimeoutMiddleware(1000);

    next.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await timeoutMiddleware(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should timeout slow requests", async () => {
    const timeoutMiddleware = createTimeoutMiddleware(100);

    next.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    await expect(timeoutMiddleware(ctx, next)).rejects.toThrow(
      "Request timeout"
    );
  });

  it("should clear timeout after request completes", async () => {
    const timeoutMiddleware = createTimeoutMiddleware(1000);
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    next.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await timeoutMiddleware(ctx, next);

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("should clear timeout even when request fails", async () => {
    const timeoutMiddleware = createTimeoutMiddleware(1000);
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    next.mockImplementation(async () => {
      throw new Error("Request error");
    });

    await expect(timeoutMiddleware(ctx, next)).rejects.toThrow("Request error");

    // Timeout should still be cleared
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("should use custom timeout value", async () => {
    const customTimeout = 50;
    const timeoutMiddleware = createTimeoutMiddleware(customTimeout);

    next.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const startTime = Date.now();
    await expect(timeoutMiddleware(ctx, next)).rejects.toThrow();
    const duration = Date.now() - startTime;

    // Should timeout around the custom timeout value (with some tolerance)
    expect(duration).toBeGreaterThanOrEqual(customTimeout);
    expect(duration).toBeLessThan(customTimeout + 50);
  });

  it("should include timeout duration in error message", async () => {
    const timeoutMs = 200;
    const timeoutMiddleware = createTimeoutMiddleware(timeoutMs);

    next.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });

    await expect(timeoutMiddleware(ctx, next)).rejects.toThrow(
      `Request timeout after ${timeoutMs}ms`
    );
  });

  it("should throw AppError with correct status code", async () => {
    const timeoutMiddleware = createTimeoutMiddleware(50);

    next.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    try {
      await timeoutMiddleware(ctx, next);
      expect.fail("Should have thrown");
    } catch (error: any) {
      expect(error.statusCode).toBe(408);
      expect(error.errorCode).toBe("REQUEST_TIMEOUT");
    }
  });
});
