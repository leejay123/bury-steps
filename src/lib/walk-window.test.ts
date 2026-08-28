import { describe, expect, it } from "vitest";
import { CLOSES_AFTER_MS, OPENS_BEFORE_MS, windowState } from "./walk-window";

describe("windowState", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");
  const durationMins = 90;

  it("is too-early well before the walk opens", () => {
    const now = new Date(startsAt.getTime() - OPENS_BEFORE_MS - 1000);
    expect(windowState(startsAt, durationMins, now)).toBe("too-early");
  });

  it("opens exactly at the configured lead time", () => {
    const now = new Date(startsAt.getTime() - OPENS_BEFORE_MS);
    expect(windowState(startsAt, durationMins, now)).toBe("open");
  });

  it("stays open while the walk is in progress", () => {
    const now = new Date(startsAt.getTime() + 30 * 60_000);
    expect(windowState(startsAt, durationMins, now)).toBe("open");
  });

  it("stays open for the grace period after the walk ends", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    const now = new Date(endsAt + CLOSES_AFTER_MS - 1000);
    expect(windowState(startsAt, durationMins, now)).toBe("open");
  });

  it("closes once the grace period has passed", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    const now = new Date(endsAt + CLOSES_AFTER_MS + 1000);
    expect(windowState(startsAt, durationMins, now)).toBe("closed");
  });
});
