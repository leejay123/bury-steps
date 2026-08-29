import { describe, expect, it } from "vitest";
import { londonWallClockToUtc } from "./dates";
import {
  buildWalkGame,
  competitionPlaces,
  formatPlaceOrdinal,
  type WalkGameAttendance,
  type WalkGameWalk,
} from "./walk-game";

function walk(id: string, day: string, extra?: Partial<WalkGameWalk>): WalkGameWalk {
  return {
    id,
    startsAt: londonWallClockToUtc(`${day}T14:00`),
    durationMins: 90,
    cancelledAt: null,
    ...extra,
  };
}

function attendance(
  walkId: string,
  userId: string,
  name: { firstName: string | null; lastName: string | null },
  extra?: Partial<WalkGameAttendance>,
): WalkGameAttendance {
  return {
    walkId,
    userId,
    clockedOutAt: null,
    firstName: name.firstName,
    lastName: name.lastName,
    ...extra,
  };
}

const NOW = londonWallClockToUtc("2026-08-30T18:00");
const ALICE = { firstName: "Alice", lastName: "Walker" };
const BOB = { firstName: "Bob", lastName: "Steps" };

const AUGUST_SUNDAYS = [
  walk("w2", "2026-08-02"),
  walk("w9", "2026-08-09"),
  walk("w16", "2026-08-16"),
  walk("w23", "2026-08-23"),
  walk("w30", "2026-08-30"),
];

describe("buildWalkGame", () => {
  it("counts this month and this year by the walk's UK start, not clock-in time", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: [walk("july", "2026-07-26"), ...AUGUST_SUNDAYS.slice(0, 2)],
      attendances: [
        attendance("july", "alice", ALICE),
        attendance("w2", "alice", ALICE),
        attendance("w9", "alice", ALICE),
      ],
    });

    expect(game.viewer.monthCount).toBe(2);
    expect(game.viewer.yearCount).toBe(3);
    expect(game.viewer.totalCount).toBe(3);
  });

  it("ignores cancelled walks and walks that have not yet completed", () => {
    const game = buildWalkGame({
      now: londonWallClockToUtc("2026-08-30T14:30"),
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: [
        walk("ok", "2026-08-23"),
        walk("cancel", "2026-08-16", { cancelledAt: londonWallClockToUtc("2026-08-15T10:00") }),
        walk("today", "2026-08-30"),
      ],
      attendances: [
        attendance("ok", "alice", ALICE),
        attendance("cancel", "alice", ALICE),
        attendance("today", "alice", ALICE),
      ],
    });

    expect(game.viewer.monthCount).toBe(1);
    expect(game.board).toHaveLength(1);
  });

  it("keeps a streak across a week that had no completed group walk", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: [walk("w2", "2026-08-02"), walk("w16", "2026-08-16"), walk("w30", "2026-08-30")],
      attendances: [
        attendance("w2", "alice", ALICE),
        attendance("w16", "alice", ALICE),
        attendance("w30", "alice", ALICE),
      ],
    });

    expect(game.viewer.streakWeeks).toBe(3);
  });

  it("breaks a streak only when the member missed a week that had a walk", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: AUGUST_SUNDAYS,
      attendances: [
        attendance("w2", "alice", ALICE),
        attendance("w9", "alice", ALICE),
        attendance("w30", "alice", ALICE),
      ],
    });

    expect(game.viewer.streakWeeks).toBe(1);
  });

  it("counts consecutive recent weeks as a streak", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: AUGUST_SUNDAYS,
      attendances: [
        attendance("w16", "alice", ALICE),
        attendance("w23", "alice", ALICE),
        attendance("w30", "alice", ALICE),
      ],
    });

    expect(game.viewer.streakWeeks).toBe(3);
  });

  it("marks a comeback after three missed weeks that had walks", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: AUGUST_SUNDAYS,
      attendances: [attendance("w2", "alice", ALICE), attendance("w30", "alice", ALICE)],
    });

    expect(game.viewer.badges.map((badge) => badge.id)).toContain("comeback");
  });

  it("does not mark a comeback after only two missed weeks", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: AUGUST_SUNDAYS,
      attendances: [
        attendance("w2", "alice", ALICE),
        attendance("w9", "alice", ALICE),
        attendance("w30", "alice", ALICE),
      ],
    });

    expect(game.viewer.badges.map((badge) => badge.id)).not.toContain("comeback");
  });

  it("lists everyone who clocked in this month, first names only, and skips zeros", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: 10,
      walks: AUGUST_SUNDAYS.slice(0, 3),
      attendances: [
        attendance("w2", "alice", ALICE),
        attendance("w9", "alice", ALICE),
        attendance("w16", "alice", ALICE),
        attendance("w2", "bob", BOB),
        attendance("w2", "cara", { firstName: "Cara", lastName: "Hill" }),
      ],
    });

    expect(game.board.map((row) => ({ name: row.name, monthCount: row.monthCount }))).toEqual([
      { name: "Alice", monthCount: 3 },
      { name: "Bob", monthCount: 1 },
      { name: "Cara", monthCount: 1 },
    ]);
    expect(game.board.some((row) => row.monthCount === 0)).toBe(false);
    expect(game.together).toEqual({ goal: 10, count: 5 });
    expect(game.cup).toEqual({ monthLabel: "August", names: ["Alice"] });
  });

  it("disambiguates two people with the same first name", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "a1",
      monthlyClockInGoal: null,
      walks: [walk("w2", "2026-08-02")],
      attendances: [
        attendance("w2", "a1", { firstName: "Sarah", lastName: "Walsh" }),
        attendance("w2", "a2", { firstName: "Sarah", lastName: "Nuttall" }),
      ],
    });

    expect(game.board.map((row) => row.name).sort()).toEqual(["Sarah N", "Sarah W"]);
  });

  it("shares the month cup on a tie, and hides together when no goal is set", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: 0,
      walks: [walk("w2", "2026-08-02")],
      attendances: [attendance("w2", "alice", ALICE), attendance("w2", "bob", BOB)],
    });

    expect(game.together).toBeNull();
    expect(game.cup?.names.sort()).toEqual(["Alice", "Bob"]);
  });

  it("awards first-walk, milestone, stayed, streak, and all-walks-in-a-month badges", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: AUGUST_SUNDAYS,
      attendances: AUGUST_SUNDAYS.map((item) => attendance(item.id, "alice", ALICE)),
    });

    const ids = game.viewer.badges.map((badge) => badge.id);
    expect(ids).toContain("first-walk");
    expect(ids).toContain("walks-5");
    expect(ids).not.toContain("walks-10");
    expect(ids).toContain("stayed");
    expect(ids).toContain("streak");
    expect(ids).toContain("all-month");
  });

  it("does not treat an early clock-out as staying for the whole walk", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: [walk("w2", "2026-08-02")],
      attendances: [
        attendance("w2", "alice", ALICE, {
          clockedOutAt: londonWallClockToUtc("2026-08-02T15:00"),
        }),
      ],
    });

    expect(game.viewer.badges.map((badge) => badge.id)).not.toContain("stayed");
    expect(game.viewer.badges.map((badge) => badge.id)).toContain("first-walk");
  });

  it("requires at least two completed walks in a month for the all-walks badge", () => {
    const game = buildWalkGame({
      now: NOW,
      viewerId: "alice",
      monthlyClockInGoal: null,
      walks: [walk("w2", "2026-08-02")],
      attendances: [attendance("w2", "alice", ALICE)],
    });

    expect(game.viewer.badges.map((badge) => badge.id)).not.toContain("all-month");
  });
});

describe("competitionPlaces", () => {
  it("assigns 1, 2, 3 on a strict order", () => {
    expect(competitionPlaces([5, 3, 1])).toEqual([1, 2, 3]);
  });

  it("shares a place on a tie and skips the next number", () => {
    expect(competitionPlaces([3, 3, 1])).toEqual([1, 1, 3]);
  });
});

describe("formatPlaceOrdinal", () => {
  it("uses st, nd, rd, and th", () => {
    expect(formatPlaceOrdinal(1)).toBe("1st");
    expect(formatPlaceOrdinal(2)).toBe("2nd");
    expect(formatPlaceOrdinal(3)).toBe("3rd");
    expect(formatPlaceOrdinal(4)).toBe("4th");
    expect(formatPlaceOrdinal(11)).toBe("11th");
    expect(formatPlaceOrdinal(12)).toBe("12th");
    expect(formatPlaceOrdinal(13)).toBe("13th");
    expect(formatPlaceOrdinal(21)).toBe("21st");
  });
});
