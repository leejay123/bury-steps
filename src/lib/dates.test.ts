import { describe, expect, it } from "vitest";
import {
  formatMembershipAge,
  formatWalkLength,
  londonMonthKey,
  londonWallClockToUtc,
  londonWeekStartKey,
  londonYmd,
  utcToLondonWallClock,
} from "./dates";

describe("londonWallClockToUtc", () => {
  it("converts a winter (GMT) wall-clock time to UTC with no offset", () => {
    // Europe/London is UTC+0 in January.
    const result = londonWallClockToUtc("2026-01-15T18:30");
    expect(result.toISOString()).toBe("2026-01-15T18:30:00.000Z");
  });

  it("converts a summer (BST) wall-clock time to UTC, subtracting an hour", () => {
    // Europe/London is UTC+1 in July — 18:30 local is 17:30 UTC.
    const result = londonWallClockToUtc("2026-07-15T18:30");
    expect(result.toISOString()).toBe("2026-07-15T17:30:00.000Z");
  });

  it("throws on an unparseable value", () => {
    expect(() => londonWallClockToUtc("not-a-date")).toThrow();
  });

  it("round-trips through utcToLondonWallClock", () => {
    const original = "2026-07-15T18:30";
    const utc = londonWallClockToUtc(original);
    expect(utcToLondonWallClock(utc)).toBe(original);
  });

  it("shifts a spring-forward gap time forward past the transition", () => {
    // Clocks in the UK jump from 00:59 GMT straight to 02:00 BST on
    // 2026-03-29, so 01:30 never happens on the wall clock. This should
    // resolve to 02:30 BST (01:30 UTC), not silently lose an hour.
    const result = londonWallClockToUtc("2026-03-29T01:30");
    expect(result.toISOString()).toBe("2026-03-29T01:30:00.000Z");
  });

  it("resolves an unambiguous time just before the spring-forward gap", () => {
    const result = londonWallClockToUtc("2026-03-29T00:30");
    expect(result.toISOString()).toBe("2026-03-29T00:30:00.000Z");
  });

  it("resolves an unambiguous time just after the spring-forward gap", () => {
    const result = londonWallClockToUtc("2026-03-29T03:00");
    expect(result.toISOString()).toBe("2026-03-29T02:00:00.000Z");
  });

  it("resolves an ambiguous autumn-fold time to the first (BST) occurrence", () => {
    // Clocks repeat 01:00-01:59 on 2026-10-25: first as BST (00:30 UTC),
    // then again as GMT (01:30 UTC). The documented behaviour picks BST.
    const result = londonWallClockToUtc("2026-10-25T01:30");
    expect(result.toISOString()).toBe("2026-10-25T00:30:00.000Z");
  });

  it("resolves an unambiguous time after the autumn fold ends", () => {
    const result = londonWallClockToUtc("2026-10-25T03:00");
    expect(result.toISOString()).toBe("2026-10-25T03:00:00.000Z");
  });
});

describe("londonYmd", () => {
  it("reads the calendar date from a UTC instant in the given timezone", () => {
    // Just after midnight UTC is still the previous evening in the US, but
    // for London (UTC+1 in July) this is already the next day locally.
    const result = londonYmd(new Date("2026-07-15T23:30:00.000Z"));
    expect(result).toEqual({ day: 16, month: 7, year: 2026 });
  });

  it("falls back to today on an invalid date rather than throwing", () => {
    const result = londonYmd(new Date("not-a-date"));
    expect(result.year).toBeGreaterThan(2000);
  });
});

describe("formatMembershipAge", () => {
  it("returns 'today' for someone who just joined", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    expect(formatMembershipAge(now, now)).toBe("today");
  });

  it("counts whole days for a recent join", () => {
    const joined = new Date("2026-06-01T12:00:00.000Z");
    const now = new Date("2026-06-13T12:00:00.000Z");
    expect(formatMembershipAge(joined, now)).toBe("12 days");
  });

  it("counts whole months once past a month", () => {
    const joined = new Date("2026-01-01T12:00:00.000Z");
    const now = new Date("2026-04-01T12:00:00.000Z");
    expect(formatMembershipAge(joined, now)).toBe("3 months");
  });

  it("combines years and months, dropping leftover days", () => {
    const joined = new Date("2023-01-10T12:00:00.000Z");
    const now = new Date("2026-03-15T12:00:00.000Z");
    expect(formatMembershipAge(joined, now)).toBe("3 years 2 months");
  });

  it("uses singular nouns for a count of one", () => {
    const joined = new Date("2026-01-01T12:00:00.000Z");
    const now = new Date("2026-02-01T12:00:00.000Z");
    expect(formatMembershipAge(joined, now)).toBe("1 month");
  });
});

describe("formatWalkLength", () => {
  it("uses minutes under an hour", () => {
    expect(formatWalkLength(45)).toBe("45 minutes");
  });

  it("uses a whole hour when there are no leftover minutes", () => {
    expect(formatWalkLength(60)).toBe("1 hour");
    expect(formatWalkLength(120)).toBe("2 hours");
  });

  it("combines hours and minutes", () => {
    expect(formatWalkLength(90)).toBe("1 hour 30 minutes");
  });
});

describe("londonWeekStartKey", () => {
  it("uses the Monday of that UK week, including for a Sunday walk", () => {
    // 30 August 2026 is a Sunday. ISO week starts Monday 24 August.
    expect(londonWeekStartKey(londonWallClockToUtc("2026-08-30T14:00"))).toBe("2026-08-24");
    expect(londonWeekStartKey(londonWallClockToUtc("2026-08-24T00:30"))).toBe("2026-08-24");
  });

  it("crosses a month boundary back to the previous Monday", () => {
    // Tuesday 1 September 2026 sits in the week that started Monday 31 August.
    expect(londonWeekStartKey(londonWallClockToUtc("2026-09-01T10:00"))).toBe("2026-08-31");
  });

  it("crosses a year boundary", () => {
    // Sunday 4 January 2026 is in the week that started Monday 29 December 2025.
    expect(londonWeekStartKey(londonWallClockToUtc("2026-01-04T14:00"))).toBe("2025-12-29");
  });
});

describe("londonMonthKey", () => {
  it("uses the UK calendar month of the instant", () => {
    expect(londonMonthKey(londonWallClockToUtc("2026-08-30T14:00"))).toBe("2026-08");
    expect(londonMonthKey(new Date("2026-07-31T23:30:00.000Z"))).toBe("2026-08");
  });
});
