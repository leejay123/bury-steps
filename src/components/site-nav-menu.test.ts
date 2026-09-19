import { describe, expect, it } from "vitest";
import { ORGANISER_PERMISSION_OPTIONS, type OrganiserPermissions } from "@/lib/organiser-permissions";
import { isNavItemActive, navItems, shouldPrefetchNavLink } from "./site-nav-items";

const NO_ORGANISER_PERMISSIONS: OrganiserPermissions = ORGANISER_PERMISSION_OPTIONS.reduce(
  (acc, option) => {
    acc[option.name] = false;
    return acc;
  },
  {} as OrganiserPermissions,
);

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
      navItems(true, "/admin", { ...NO_ORGANISER_PERMISSIONS, permMembersView: true }).map(
        (item) => item.href,
      ),
    ).toEqual(["/", "/walks", "/notices", "/progress", "/admin/members", "/admin/guide"]);
  });

  it("hides every organiser section for someone with no permissions at all", () => {
    expect(navItems(true, "/admin", NO_ORGANISER_PERMISSIONS).map((item) => item.href)).toEqual([
      "/",
      "/walks",
      "/notices",
      "/progress",
      "/admin/guide",
    ]);
  });

  it("shows Settings for any one of the seven settings-area permissions", () => {
    expect(
      navItems(true, "/admin", { ...NO_ORGANISER_PERMISSIONS, permCacheReset: true })
        .map((item) => item.href)
        .includes("/admin/settings"),
    ).toBe(true);
  });

  it("shows Messages and Reports independently of each other", () => {
    const messagesOnly = navItems(true, "/admin", {
      ...NO_ORGANISER_PERMISSIONS,
      permMessages: true,
    }).map((item) => item.href);
    expect(messagesOnly).toContain("/admin/messages");
    expect(messagesOnly).not.toContain("/admin/reports");

    const reportsOnly = navItems(true, "/admin", {
      ...NO_ORGANISER_PERMISSIONS,
      permReportsView: true,
    }).map((item) => item.href);
    expect(reportsOnly).toContain("/admin/reports");
    expect(reportsOnly).not.toContain("/admin/messages");
  });

  it("without the Walks permission, Walks points at the member page instead of the admin dashboard", () => {
    const items = navItems(true, "/admin", NO_ORGANISER_PERMISSIONS);
    expect(items.find((item) => item.label === "Walks")?.href).toBe("/walks");
  });

  it("with the Walks permission, Walks still points at the admin dashboard", () => {
    const items = navItems(true, "/admin", { ...NO_ORGANISER_PERMISSIONS, permWalksView: true });
    expect(items.find((item) => item.label === "Walks")?.href).toBe("/admin");
  });
});

describe("isNavItemActive", () => {
  it("does not treat Progress as the member Walks page", () => {
    expect(isNavItemActive("/progress", "/walks")).toBe(false);
    expect(isNavItemActive("/progress", "/progress")).toBe(true);
  });

  it("treats an individual walk's share page (/w/<slug>) as the Walks tab", () => {
    expect(isNavItemActive("/w/sunday-stroll-ab12", "/walks")).toBe(true);
    expect(isNavItemActive("/w/ab12", "/walks")).toBe(true);
  });
});

describe("navItems progressEnabled", () => {
  it("shows Progress by default, and when explicitly on", () => {
    expect(navItems(false, "/walks").some((item) => item.label === "Progress")).toBe(true);
    expect(navItems(false, "/walks", undefined, true).some((item) => item.label === "Progress")).toBe(
      true,
    );
  });

  it("drops Progress from the nav when the site-wide switch is off", () => {
    expect(navItems(false, "/walks", undefined, false).some((item) => item.label === "Progress")).toBe(
      false,
    );
    expect(navItems(true, "/admin", undefined, false).some((item) => item.label === "Progress")).toBe(
      false,
    );
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
