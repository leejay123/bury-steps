import { describe, expect, it } from "vitest";
import { isNavItemActive, navItems } from "./site-nav-items";

describe("navItems", () => {
  it("includes Notices and Progress for members and organisers", () => {
    expect(navItems(false, "/dashboard").map((item) => item.href)).toEqual([
      "/",
      "/dashboard",
      "/notices",
      "/progress",
      "/history",
    ]);
    expect(navItems(true, "/admin").map((item) => item.href)).toEqual([
      "/",
      "/admin",
      "/notices",
      "/progress",
      "/admin/members",
      "/admin/reports",
      "/admin/settings",
      "/admin/guide",
    ]);
  });
});

describe("isNavItemActive", () => {
  it("does not treat Progress as the member Walks page", () => {
    expect(isNavItemActive("/progress", "/dashboard")).toBe(false);
    expect(isNavItemActive("/progress", "/progress")).toBe(true);
  });
});
