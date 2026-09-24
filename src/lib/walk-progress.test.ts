import { describe, expect, it } from "vitest";
import { walkGameFromLoadedData, type WalkGameLoadedData } from "./walk-progress";

function data(overrides: Partial<WalkGameLoadedData> = {}): WalkGameLoadedData {
  const startsAt = new Date("2026-08-10T12:00:00Z");
  return {
    now: new Date("2026-08-20T12:00:00Z"),
    monthlyClockInGoal: null,
    walks: [
      {
        id: "walk-1",
        startsAt,
        durationMins: 60,
        cancelledAt: null,
        endedAt: null,
        attendances: [
          {
            userId: "viewer",
            clockedOutAt: null,
            user: { firstName: "Pat", lastName: "Lee" },
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("walkGameFromLoadedData", () => {
  it("adds older-than-window attendances onto the in-window completed total", () => {
    const game = walkGameFromLoadedData("viewer", data(), 4);
    expect(game.viewer.totalCount).toBe(5);
    expect(game.viewer.badges.some((badge) => badge.id === "walks-5")).toBe(true);
  });

  it("does not inflate totals when the older count is zero or omitted", () => {
    expect(walkGameFromLoadedData("viewer", data()).viewer.totalCount).toBe(1);
    expect(walkGameFromLoadedData("viewer", data(), 0).viewer.totalCount).toBe(1);
  });
});
