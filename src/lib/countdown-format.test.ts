import { describe, expect, it } from "vitest";
import { formatCountdown } from "./countdown-format";

const at = (d: number, h: number, m: number, s: number) => (((d * 24 + h) * 60 + m) * 60 + s) * 1000;

describe("formatCountdown", () => {
  it("shows a digital clock, with days first once there are any", () => {
    expect(formatCountdown(at(0, 1, 49, 21), "digital")).toBe("01:49:21");
    expect(formatCountdown(at(2, 1, 49, 21), "digital")).toBe("2:01:49:21");
    expect(formatCountdown(at(0, 0, 0, 5), "digital")).toBe("00:00:05");
  });

  it("shows narrow units, leaving out leading zeros", () => {
    expect(formatCountdown(at(53, 15, 26, 43), "narrow")).toBe("53d 15h 26m 43s");
    expect(formatCountdown(at(0, 1, 49, 21), "narrow")).toBe("1h 49m 21s");
    expect(formatCountdown(at(0, 0, 25, 0), "narrow")).toBe("25m 0s");
  });

  it("shows short and long words, singular for one", () => {
    expect(formatCountdown(at(53, 15, 26, 43), "short")).toBe("53 days, 15 hr, 26 min, 43 sec");
    expect(formatCountdown(at(1, 1, 1, 1), "long")).toBe("1 day, 1 hour, 1 minute, 1 second");
    expect(formatCountdown(at(0, 2, 0, 30), "long")).toBe("2 hours, 0 minutes, 30 seconds");
  });

  it("never goes below zero", () => {
    expect(formatCountdown(-5000, "narrow")).toBe("0s");
    expect(formatCountdown(-5000, "digital")).toBe("00:00:00");
  });
});
