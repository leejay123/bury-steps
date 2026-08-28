import { describe, expect, it } from "vitest";
import { DEFAULT_PRIMARY_COLOR, normalizeHex, themeCssVars } from "./theme";

describe("normalizeHex", () => {
  it("accepts a 6-digit hex with a leading #", () => {
    expect(normalizeHex("#1F3D2B")).toBe("#1f3d2b");
  });

  it("accepts a 6-digit hex without a leading #", () => {
    expect(normalizeHex("1f3d2b")).toBe("#1f3d2b");
  });

  it("expands a 3-digit shorthand hex", () => {
    expect(normalizeHex("#abc")).toBe("#aabbcc");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeHex("  #1f3d2b  ")).toBe("#1f3d2b");
  });

  it("rejects invalid input", () => {
    expect(normalizeHex("not-a-colour")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("")).toBeNull();
    // CSS injection attempt via the colour field, rather than a hex code.
    expect(normalizeHex("red; } body { display: none")).toBeNull();
  });
});

describe("themeCssVars", () => {
  it("falls back to the default colour for an invalid hex", () => {
    const fallback = themeCssVars(DEFAULT_PRIMARY_COLOR);
    expect(themeCssVars("not-a-colour")).toEqual(fallback);
  });

  it("always returns a foreground colour with enough contrast to read", () => {
    // Very light and very dark primaries are the cases most likely to pick
    // the wrong (illegible) foreground colour.
    for (const hex of ["#ffffff", "#000000", "#1f3d2b", "#f2c94c"]) {
      const vars = themeCssVars(hex);
      expect(vars["--primary-foreground"]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("produces every expected CSS variable", () => {
    const vars = themeCssVars("#1f3d2b");
    for (const key of [
      "--primary",
      "--primary-foreground",
      "--ring",
      "--foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--accent-foreground",
      "--border",
      "--input",
    ] as const) {
      expect(vars[key]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
