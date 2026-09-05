import { describe, expect, it } from "vitest";
import { isNavItemActive, navItems, shouldPrefetchNavLink } from "./site-nav-items";

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
      "/admin/routes",
      "/admin/messages",
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

describe("shouldPrefetchNavLink", () => {
  it("skips prefetch for sign-in-required routes not in the middleware's public allowlist", () => {
    // A guest's prefetch fetch() for one of these follows the middleware's
    // redirect to Clerk's cross-origin sign-in page, which the browser
    // blocks as a CORS violation — skip prefetching them entirely.
    expect(shouldPrefetchNavLink("/dashboard")).toBe(false);
    expect(shouldPrefetchNavLink("/notices")).toBe(false);
    expect(shouldPrefetchNavLink("/progress")).toBe(false);
    expect(shouldPrefetchNavLink("/history")).toBe(false);
  });

  it("still prefetches public routes", () => {
    expect(shouldPrefetchNavLink("/")).toBe(true);
    expect(shouldPrefetchNavLink("/admin")).toBe(true);
  });
});
