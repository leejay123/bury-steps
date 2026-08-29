import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * Mirrors the chunked delay used by useWalkClock so long waits never pass
 * a value browsers clamp (setTimeout max is ~24.8 days).
 */
export const MAX_TIMER_DELAY_MS = 2_147_483_647;

export function walkClockDelayMs(targetAt: Date, nowMs = Date.now()): number {
  return Math.min(Math.max(0, targetAt.getTime() - nowMs), MAX_TIMER_DELAY_MS);
}

describe("walkClockDelayMs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T12:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the full delay for a short wait", () => {
    const target = new Date(Date.now() + 60_000);
    expect(walkClockDelayMs(target)).toBe(60_000);
  });

  it("never exceeds the browser setTimeout limit for a walk months away", () => {
    const target = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    expect(walkClockDelayMs(target)).toBe(MAX_TIMER_DELAY_MS);
    expect(walkClockDelayMs(target)).toBeLessThanOrEqual(MAX_TIMER_DELAY_MS);
  });

  it("never goes negative when the target is in the past", () => {
    expect(walkClockDelayMs(new Date(Date.now() - 1000))).toBe(0);
  });
});
