import { describe, expect, it } from "vitest";
import {
  adminLandingPath,
  describeOrganiserPermissions,
  FULL_ORGANISER_PERMISSIONS,
  hasAnyPermission,
  hasFullAccess,
  type OrganiserPermissions,
} from "./organiser-permissions";

const NONE: OrganiserPermissions = {
  permWalks: false,
  permMembers: false,
  permReportsMessages: false,
  permSettings: false,
};

describe("hasFullAccess", () => {
  it("is true only when every permission is granted", () => {
    expect(hasFullAccess(FULL_ORGANISER_PERMISSIONS)).toBe(true);
    expect(hasFullAccess({ ...FULL_ORGANISER_PERMISSIONS, permSettings: false })).toBe(false);
    expect(hasFullAccess(NONE)).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("is false only when every permission is off", () => {
    expect(hasAnyPermission(NONE)).toBe(false);
  });

  it("is true when at least one permission is granted", () => {
    expect(hasAnyPermission({ ...NONE, permWalks: true })).toBe(true);
    expect(hasAnyPermission(FULL_ORGANISER_PERMISSIONS)).toBe(true);
  });
});

describe("adminLandingPath", () => {
  it("prefers Walks, then Members, then Reports & messages, then Settings", () => {
    expect(adminLandingPath(FULL_ORGANISER_PERMISSIONS)).toBe("/admin");
    expect(adminLandingPath({ ...NONE, permMembers: true })).toBe("/admin/members");
    expect(adminLandingPath({ ...NONE, permReportsMessages: true })).toBe("/admin/messages");
    expect(adminLandingPath({ ...NONE, permSettings: true })).toBe("/admin/settings");
  });

  it("falls back to the Guide when nothing is granted", () => {
    expect(adminLandingPath(NONE)).toBe("/admin/guide");
  });
});

describe("describeOrganiserPermissions", () => {
  it("uses the short full-access phrasing when everything is granted", () => {
    expect(describeOrganiserPermissions(FULL_ORGANISER_PERMISSIONS)).toBe(
      "You'll be able to create and edit walks, manage members, and see who's coming on each walk.",
    );
  });

  it("names only what's granted for a single permission", () => {
    const result = describeOrganiserPermissions({ ...NONE, permMembers: true });
    expect(result).toBe(
      "You'll be able to view the member list, promote or demote organisers, and remove members.",
    );
  });

  it("joins multiple granted permissions with a final 'and'", () => {
    const result = describeOrganiserPermissions({
      ...NONE,
      permWalks: true,
      permSettings: true,
    });
    expect(result.startsWith("You'll be able to create, edit, and cancel walks")).toBe(true);
    expect(result).toContain("; and edit homepage content, FAQs, notices, and site-wide settings.");
  });

  it("explains nothing was granted when every permission is false", () => {
    expect(describeOrganiserPermissions(NONE)).toBe(
      "No specific organiser tools were switched on for this invite — check with whoever invited you once you've accepted.",
    );
  });
});
