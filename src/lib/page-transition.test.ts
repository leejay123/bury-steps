import { describe, expect, it } from "vitest";
import { slideDirection } from "./page-transition";

describe("slideDirection", () => {
  it.each([
    ["/walks", "/w/burrs", 1],
    ["/w/burrs", "/walks", -1],
    ["/admin", "/admin/walks/abc", 1],
    ["/admin/walks/abc", "/admin", -1],
    ["/admin/settings", "/admin/settings/branding", 1],
    ["/admin/settings/branding", "/admin/settings", -1],
    ["/notices", "/notices/welcome", 1],
    ["/admin/members/abc", "/admin/members", -1],
    // Sideways: main sections, and sibling settings pages.
    ["/admin", "/admin/settings", 0],
    ["/", "/walks", 0],
    ["/admin/settings/branding", "/admin/settings/behaviour", 0],
    ["/walks", "/notices", 0],
  ] as const)("%s → %s is %i", (from, to, expected) => {
    expect(slideDirection(from, to)).toBe(expected);
  });
});
