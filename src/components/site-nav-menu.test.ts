import { describe, expect, it } from "vitest";
import { isNavItemActive, navItems } from "./site-nav-items";

describe("navItems", () => {
  it("includes Notices and Progress for members and organisers", () => {
    expect(navItems(false, "/dashboard").map((item) => item.href)).toEqual([
      "/",
      "/dashboard",
      "/notices",
      "/dashboard/progress",
      "/dashboard/history",
    ]);
    expect(navItems(true, "/admin").map((item) => item.href)).toEqual([
      "/",
      "/admin",
      "/notices",
      "/dashboard/progress",
      "/admin/members",
      "/admin/reports",
      "/admin/settings",
      "/admin/guide",
    ]);
  });
});

describe("isNavItemActive", () => {
  it("does not treat Progress as the member Walks page", () => {
    expect(isNavItemActive("/dashboard/progress", "/dashboard")).toBe(false);
    expect(isNavItemActive("/dashboard/progress", "/dashboard/progress")).toBe(true);
  });
});
