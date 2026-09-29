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
    // Main sections: like tabs, by menu order.
    ["/admin", "/admin/settings", 1],
    ["/", "/walks", 1],
    ["/walks", "/notices", 1],
    ["/admin/reports", "/notices", -1],
    ["/admin/members", "/progress", -1],
    ["/admin/settings/branding", "/admin/guide", 1],
    // Sideways within a section, and pages outside the menu: fade.
    ["/admin/settings/branding", "/admin/settings/behaviour", 0],
    ["/contact", "/privacy-policy", 0],
    ["/contact", "/notices", 0],
  ] as const)("%s → %s is %i", (from, to, expected) => {
    expect(slideDirection(from, to)).toBe(expected);
  });
});
