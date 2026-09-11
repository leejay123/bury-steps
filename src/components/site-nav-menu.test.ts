import { describe, expect, it } from "vitest";
import { isNavItemActive, navItems, shouldPrefetchNavLink } from "./site-nav-items";

describe("navItems", () => {
  it("includes Notices and Progress for members and organisers", () => {
    expect(navItems(false, "/walks").map((item) => item.href)).toEqual([
      "/",
      "/walks",
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
      "/admin/messages",
      "/admin/reports",
      "/admin/settings",
      "/admin/guide",
    ]);
  });
});

describe("navItems with limited organiser permissions", () => {
  it("hides each section behind its own permission, keeps Guide unconditional", () => {
    expect(
      navItems(true, "/admin", {
        permWalks: false,
        permMembers: true,
        permReportsMessages: false,
        permSettings: false,
      }).map((item) => item.href),
    ).toEqual(["/", "/walks", "/notices", "/progress", "/admin/members", "/admin/guide"]);
  });

  it("hides every organiser section for someone with no permissions at all", () => {
    expect(
      navItems(true, "/admin", {
        permWalks: false,
        permMembers: false,
        permReportsMessages: false,
        permSettings: false,
      }).map((item) => item.href),
    ).toEqual(["/", "/walks", "/notices", "/progress", "/admin/guide"]);
  });

  it("without the Walks permission, Walks points at the member page instead of the admin dashboard", () => {
    const items = navItems(true, "/admin", {
      permWalks: false,
      permMembers: false,
      permReportsMessages: false,
      permSettings: false,
    });
    expect(items.find((item) => item.label === "Walks")?.href).toBe("/walks");
  });

  it("with the Walks permission, Walks still points at the admin dashboard", () => {
    const items = navItems(true, "/admin", {
      permWalks: true,
      permMembers: false,
      permReportsMessages: false,
      permSettings: false,
    });
    expect(items.find((item) => item.label === "Walks")?.href).toBe("/admin");
  });
});

describe("isNavItemActive", () => {
  it("does not treat Progress as the member Walks page", () => {
    expect(isNavItemActive("/progress", "/walks")).toBe(false);
    expect(isNavItemActive("/progress", "/progress")).toBe(true);
  });
});

describe("shouldPrefetchNavLink", () => {
  it("skips prefetch for sign-in-required routes not in the middleware's public allowlist", () => {
    // A guest's prefetch fetch() for one of these follows the middleware's
    // redirect to Clerk's cross-origin sign-in page, which the browser
    // blocks as a CORS violation — skip prefetching them entirely.
    expect(shouldPrefetchNavLink("/walks")).toBe(false);
    expect(shouldPrefetchNavLink("/notices")).toBe(false);
    expect(shouldPrefetchNavLink("/progress")).toBe(false);
    expect(shouldPrefetchNavLink("/history")).toBe(false);
  });

  it("still prefetches public routes", () => {
    expect(shouldPrefetchNavLink("/")).toBe(true);
    expect(shouldPrefetchNavLink("/admin")).toBe(true);
  });
});
