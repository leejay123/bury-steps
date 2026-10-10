import { describe, expect, it } from "vitest";
import { parseWalkPageSections, serializeWalkPageSections } from "./walk-page-sections";

describe("walk page sections", () => {
  it("defaults to every section in the standard order", () => {
    expect(parseWalkPageSections(null).map((s) => s.id)).toEqual(["before", "map", "forecast", "precise"]);
    expect(parseWalkPageSections(null).every((s) => s.visible)).toBe(true);
  });

  it("keeps the saved order and hidden sections", () => {
    const sections = parseWalkPageSections("forecast,-map,precise,before");
    expect(sections).toEqual([
      { id: "forecast", visible: true },
      { id: "map", visible: false },
      { id: "precise", visible: true },
      { id: "before", visible: true },
    ]);
    expect(serializeWalkPageSections(sections)).toBe("forecast,-map,precise,before");
  });

  it("ignores unknown or repeated ids and adds missing ones last", () => {
    expect(parseWalkPageSections("map,map,nonsense").map((s) => s.id)).toEqual(["map", "before", "forecast", "precise"]);
  });

  it("never hides Before you set off here (it has its own switch)", () => {
    expect(parseWalkPageSections("-before")[0]).toEqual({ id: "before", visible: true });
    expect(serializeWalkPageSections([{ id: "before", visible: false }])).toBe("before");
  });
});
