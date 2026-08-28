import { describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit", () => {
    const key = `test:${crypto.randomUUID()}`;
    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit(key, 3, 60_000)).toEqual({ ok: true });
    }
  });

  it("blocks once the limit is exceeded within the window", () => {
    const key = `test:${crypto.randomUUID()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const result = checkRateLimit(key, 2, 60_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("resets after the window passes", () => {
    vi.useFakeTimers();
    try {
      const key = `test:${crypto.randomUUID()}`;
      checkRateLimit(key, 1, 1000);
      expect(checkRateLimit(key, 1, 1000).ok).toBe(false);
      vi.advanceTimersByTime(1001);
      expect(checkRateLimit(key, 1, 1000).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks separate keys independently", () => {
    const keyA = `test:${crypto.randomUUID()}`;
    const keyB = `test:${crypto.randomUUID()}`;
    checkRateLimit(keyA, 1, 60_000);
    expect(checkRateLimit(keyA, 1, 60_000).ok).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000).ok).toBe(true);
  });
});
