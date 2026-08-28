import { describe, expect, it } from "vitest";
import {
  formatMembershipAge,
  londonWallClockToUtc,
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
