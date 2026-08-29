import { describe, expect, it } from "vitest";
import {
  canOrganiserAddAttendance,
  canOrganiserEditJourney,
  formatStartingSoonCountdown,
  isWalkHistoryReady,
  isWalkScheduleLocked,
  MAX_WALK_DURATION_MINS,
  nextWalkStatusChangeAt,
  OPENS_BEFORE_MS,
  organiserRecordedClockInAt,
  upcomingListLookbackFrom,
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

  it("closes at the scheduled end", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    expect(windowState(startsAt, durationMins, new Date(endsAt))).toBe("closed");
    expect(windowState(startsAt, durationMins, new Date(endsAt + 1000))).toBe("closed");
  });

  it("stays open a second before the scheduled end", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    expect(windowState(startsAt, durationMins, new Date(endsAt - 1000))).toBe("open");
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

  it("is starting-soon from an hour before the start until the start", () => {
    const now = new Date(startsAt.getTime() - OPENS_BEFORE_MS);
    expect(walkStatus({ cancelledAt: null, startsAt, durationMins }, now)).toBe("starting-soon");
  });

  it("stays starting-soon a second before the start", () => {
    const now = new Date(startsAt.getTime() - 1000);
    expect(walkStatus({ cancelledAt: null, startsAt, durationMins }, now)).toBe("starting-soon");
  });

  it("is in-progress from the published start until the walk is due to finish", () => {
    expect(walkStatus({ cancelledAt: null, startsAt, durationMins }, startsAt)).toBe("in-progress");
    const now = new Date(startsAt.getTime() + 30 * 60_000);
    expect(walkStatus({ cancelledAt: null, startsAt, durationMins }, now)).toBe("in-progress");
  });

  it("is completed once the scheduled end is reached", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    expect(walkStatus({ cancelledAt: null, startsAt, durationMins }, new Date(endsAt))).toBe(
      "completed",
    );
    expect(
      walkStatus({ cancelledAt: null, startsAt, durationMins }, new Date(endsAt + 1000)),
    ).toBe("completed");
  });
});

describe("upcomingListLookbackFrom", () => {
  it("keeps a max-length walk visible until its clock-in window has closed", () => {
    const now = new Date("2026-06-01T18:00:00.000Z");
    const lookback = upcomingListLookbackFrom(now);
    const longestStart = new Date(now.getTime() - MAX_WALK_DURATION_MINS * 60_000 + 1000);
    expect(longestStart.getTime()).toBeGreaterThan(lookback.getTime());
    expect(windowState(longestStart, MAX_WALK_DURATION_MINS, now)).toBe("open");
  });

  it("is later than the old fixed 3-hour cutoff", () => {
    const now = new Date("2026-06-01T18:00:00.000Z");
    const threeHours = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    expect(upcomingListLookbackFrom(now).getTime()).toBeLessThan(threeHours.getTime());
  });
});

describe("canOrganiserEditJourney", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");
  const durationMins = 90;

  it("is false before the walk starts", () => {
    const now = new Date(startsAt.getTime() - 30 * 60_000);
    expect(canOrganiserEditJourney({ cancelledAt: null, startsAt, durationMins }, now)).toBe(
      false,
    );
  });

  it("is true once the walk is in progress", () => {
    const now = new Date(startsAt.getTime() + 10 * 60_000);
    expect(canOrganiserEditJourney({ cancelledAt: null, startsAt, durationMins }, now)).toBe(true);
  });

  it("is true after the walk has completed", () => {
    const now = new Date(startsAt.getTime() + durationMins * 60_000 + 1000);
    expect(canOrganiserEditJourney({ cancelledAt: null, startsAt, durationMins }, now)).toBe(true);
  });

  it("is false when the walk is cancelled", () => {
    const now = new Date(startsAt.getTime() + 10 * 60_000);
    expect(
      canOrganiserEditJourney({ cancelledAt: new Date(), startsAt, durationMins }, now),
    ).toBe(false);
  });
});

describe("formatStartingSoonCountdown", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");

  it("formats mm:ss until start", () => {
    const now = new Date(startsAt.getTime() - (23 * 60 + 4) * 1000);
    expect(formatStartingSoonCountdown(startsAt, now)).toBe("23:04");
  });

  it("pads single-digit seconds", () => {
    const now = new Date(startsAt.getTime() - 65 * 1000);
    expect(formatStartingSoonCountdown(startsAt, now)).toBe("1:05");
  });

  it("returns null once start has passed", () => {
    expect(formatStartingSoonCountdown(startsAt, startsAt)).toBeNull();
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
    const now = new Date(endsAt + 1000);
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
    const now = new Date(endsAt + 1000);
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
    const now = new Date(endsAt + 1000);
    expect(organiserRecordedClockInAt({ startsAt, durationMins }, now)).toEqual(startsAt);
  });
});

describe("nextWalkStatusChangeAt", () => {
  const startsAt = new Date("2026-06-01T10:00:00.000Z");
  const durationMins = 90;
  const walk = { cancelledAt: null, startsAt, durationMins };

  it("is the clock-in open time while the walk is still upcoming", () => {
    const now = new Date(startsAt.getTime() - OPENS_BEFORE_MS - 60_000);
    expect(nextWalkStatusChangeAt(walk, now)).toEqual(
      new Date(startsAt.getTime() - OPENS_BEFORE_MS),
    );
  });

  it("is the start while gathering", () => {
    const now = new Date(startsAt.getTime() - 10 * 60_000);
    expect(nextWalkStatusChangeAt(walk, now)).toEqual(startsAt);
  });

  it("is the scheduled end while in progress", () => {
    const now = new Date(startsAt.getTime() + 10 * 60_000);
    expect(nextWalkStatusChangeAt(walk, now)).toEqual(
      new Date(startsAt.getTime() + durationMins * 60_000),
    );
  });

  it("is null once completed or cancelled", () => {
    const endsAt = startsAt.getTime() + durationMins * 60_000;
    const now = new Date(endsAt + 1000);
    expect(nextWalkStatusChangeAt(walk, now)).toBeNull();
    expect(
      nextWalkStatusChangeAt({ cancelledAt: new Date(), startsAt, durationMins }, startsAt),
    ).toBeNull();
  });
});
