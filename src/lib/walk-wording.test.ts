import { describe, expect, it } from "vitest";
import {
  changedWalkWording,
  fillWording,
  parseWalkWording,
  WALK_WORDING_DEFAULTS,
  walkCountdown,
} from "./walk-wording";

describe("walk wording", () => {
  it("uses the defaults for anything not saved or left blank", () => {
    const words = parseWalkWording({ upcomingLabel: "Coming up", openLine: "   ", nonsense: "x" });
    expect(words.upcomingLabel).toBe("Coming up");
    expect(words.openLine).toBe(WALK_WORDING_DEFAULTS.openLine);
    expect(parseWalkWording(null)).toEqual(WALK_WORDING_DEFAULTS);
  });

  it("saves only the lines that differ from the defaults", () => {
    expect(
      changedWalkWording({ upcomingLabel: "Coming up", liveLabel: WALK_WORDING_DEFAULTS.liveLabel, openLine: "" }),
    ).toEqual({ upcomingLabel: "Coming up" });
  });

  it("fills in placeholders and leaves unknown ones", () => {
    expect(fillWording("Clock-in from {opens} {what}", { opens: "09:15" })).toBe("Clock-in from 09:15 {what}");
  });

  it("counts down, with 1 day said properly", () => {
    const w = parseWalkWording(null);
    expect(walkCountdown(w, "upcoming", 4 * 1440 + 10, 0)).toEqual({ value: "4", unit: "days to go" });
    expect(walkCountdown(w, "upcoming", 1440 + 300, 0)).toEqual({ value: "1", unit: "day to go" });
    expect(walkCountdown(w, "upcoming", 300, 0)).toEqual({ value: "5", unit: "hours to go" });
    expect(walkCountdown(w, "starting-soon", 45, 0)).toEqual({ value: "45", unit: "min to go" });
    expect(walkCountdown(w, "in-progress", 0, 30)).toEqual({ value: "30", unit: "min left" });
  });

  it("keeps edited countdown words, even with the number moved", () => {
    const w = parseWalkWording({ countdownDays: "Only {n} sleeps" });
    expect(walkCountdown(w, "upcoming", 3 * 1440, 0)).toEqual({ value: "", unit: "Only 3 sleeps" });
  });
});
