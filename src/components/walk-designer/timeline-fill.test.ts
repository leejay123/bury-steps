import { describe, expect, it } from "vitest";
import { timelineFill } from "./blocks";

const at = (hhmm: string) => new Date(`2026-11-08T${hhmm}:00Z`);
const day = [at("09:15"), at("10:15"), at("14:15")];

describe("timelineFill", () => {
  it("reaches each label at its time, with the labels spread evenly", () => {
    expect(timelineFill(day, at("09:00"))).toBe(0);
    expect(timelineFill(day, at("09:45"))).toBe(25);
    expect(timelineFill(day, at("10:15"))).toBe(50);
    expect(timelineFill(day, at("12:15"))).toBe(75);
    expect(timelineFill(day, at("15:00"))).toBe(100);
  });

  it("works with only two times shown", () => {
    expect(timelineFill([at("10:15"), at("14:15")], at("12:15"))).toBe(50);
  });
});
