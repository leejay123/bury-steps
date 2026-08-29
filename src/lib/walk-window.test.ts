import { describe, expect, it } from "vitest";
import {
  CLOSES_AFTER_MS,
  canOrganiserAddAttendance,
  isWalkHistoryReady,
  isWalkScheduleLocked,
  OPENS_BEFORE_MS,
  organiserRecordedClockInAt,
  walkStatus,
  windowState,
} from "./walk-window";

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

describe("walkStatus", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");
  const durationMins = 90;

  it("is cancelled if cancelledAt is set, regardless of timing", () => {
    const now = new Date(startsAt.getTime() + 30 * 60_000);
    expect(walkStatus({ cancelledAt: new Date(), startsAt, durationMins }, now)).toBe("cancelled");
  });

  it("is upcoming before the clock-in window opens", () => {
    const now = new Date(startsAt.getTime() - OPENS_BEFORE_MS - 1000);
    expect(walkStatus({ cancelledAt: null, startsAt, durationMins }, now)).toBe("upcoming");
  });

  it("is open while clock-in is available", () => {
    const now = new Date(startsAt.getTime() + 30 * 60_000);
    expect(walkStatus({ cancelledAt: null, startsAt, durationMins }, now)).toBe("open");
  });

  it("is completed once the clock-in window has fully closed", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    const now = new Date(endsAt + CLOSES_AFTER_MS + 1000);
    expect(walkStatus({ cancelledAt: null, startsAt, durationMins }, now)).toBe("completed");
  });
});

describe("isWalkHistoryReady", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");
  const durationMins = 90;

  it("is false while the walk is still open", () => {
    const now = new Date(startsAt.getTime() + 30 * 60_000);
    expect(isWalkHistoryReady({ cancelledAt: null, startsAt, durationMins }, now)).toBe(false);
  });

  it("is true once the walk has completed", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    const now = new Date(endsAt + CLOSES_AFTER_MS + 1000);
    expect(isWalkHistoryReady({ cancelledAt: null, startsAt, durationMins }, now)).toBe(true);
  });

  it("is true for a cancelled walk even if its window would still be open", () => {
    const now = new Date(startsAt.getTime() + 30 * 60_000);
    expect(isWalkHistoryReady({ cancelledAt: new Date(), startsAt, durationMins }, now)).toBe(
      true,
    );
  });
});

describe("isWalkScheduleLocked", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");

  it("is unlocked an hour before start, when clock-in is already open", () => {
    const now = new Date(startsAt.getTime() - OPENS_BEFORE_MS);
    expect(isWalkScheduleLocked(startsAt, now)).toBe(false);
  });

  it("is unlocked a second before start", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(isWalkScheduleLocked(startsAt, now)).toBe(false);
  });

  it("locks at the published start", () => {
    expect(isWalkScheduleLocked(startsAt, startsAt)).toBe(true);
  });

  it("stays locked after start", () => {
    const now = new Date(startsAt.getTime() + 30 * 60_000);
    expect(isWalkScheduleLocked(startsAt, now)).toBe(true);
  });
});

describe("canOrganiserAddAttendance", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");
  const durationMins = 90;

  it("is false before clock-in opens", () => {
    const now = new Date(startsAt.getTime() - OPENS_BEFORE_MS - 1000);
    expect(canOrganiserAddAttendance({ cancelledAt: null, startsAt, durationMins }, now)).toBe(
      false,
    );
  });

  it("is true while clock-in is open", () => {
    const now = new Date(startsAt.getTime() + 30 * 60_000);
    expect(canOrganiserAddAttendance({ cancelledAt: null, startsAt, durationMins }, now)).toBe(
      true,
    );
  });

  it("is true after the walk has completed", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    const now = new Date(endsAt + CLOSES_AFTER_MS + 1000);
    expect(canOrganiserAddAttendance({ cancelledAt: null, startsAt, durationMins }, now)).toBe(
      true,
    );
  });

  it("is false when the walk is cancelled", () => {
    const now = new Date(startsAt.getTime() + 30 * 60_000);
    expect(
      canOrganiserAddAttendance({ cancelledAt: new Date(), startsAt, durationMins }, now),
    ).toBe(false);
  });
});

describe("organiserRecordedClockInAt", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");
  const durationMins = 90;

  it("uses now while the clock-in window is still open", () => {
    const now = new Date(startsAt.getTime() + 20 * 60_000);
    expect(organiserRecordedClockInAt({ startsAt, durationMins }, now)).toEqual(now);
  });

  it("uses the start once the walk has completed, so they don't appear after it finished", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    const now = new Date(endsAt + CLOSES_AFTER_MS + 1000);
    expect(organiserRecordedClockInAt({ startsAt, durationMins }, now)).toEqual(startsAt);
  });
});
