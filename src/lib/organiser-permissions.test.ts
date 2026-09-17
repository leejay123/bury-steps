import { describe, expect, it } from "vitest";
import {
  describeOrganiserPermissions,
  FULL_ORGANISER_PERMISSIONS,
  hasAnyPermission,
  hasAnySettingsPermission,
  hasFullAccess,
  NO_ORGANISER_PERMISSIONS,
  type OrganiserPermissions,
  walksLandingPath,
} from "./organiser-permissions";

const NONE: OrganiserPermissions = NO_ORGANISER_PERMISSIONS;

describe("hasFullAccess", () => {
  it("is true only when every permission is granted", () => {
    expect(hasFullAccess(FULL_ORGANISER_PERMISSIONS)).toBe(true);
    expect(hasFullAccess({ ...FULL_ORGANISER_PERMISSIONS, permCacheReset: false })).toBe(false);
    expect(hasFullAccess(NONE)).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("is false only when every permission is off", () => {
    expect(hasAnyPermission(NONE)).toBe(false);
  });

  it("is true when at least one permission is granted", () => {
    expect(hasAnyPermission({ ...NONE, permWalksView: true })).toBe(true);
    expect(hasAnyPermission(FULL_ORGANISER_PERMISSIONS)).toBe(true);
  });
});

describe("hasAnySettingsPermission", () => {
  it("is false when none of the seven settings-area permissions is granted", () => {
    expect(hasAnySettingsPermission(NONE)).toBe(false);
    // Core permissions don't count — Walks/Members/Messages/Reports aren't
    // part of the Settings hub.
    expect(
      hasAnySettingsPermission({
        ...NONE,
        permWalksView: true,
        permMembersView: true,
        permReports: true,
      }),
    ).toBe(false);
  });

  it("is true when any one settings-area permission is granted", () => {
    expect(hasAnySettingsPermission({ ...NONE, permHomepage: true })).toBe(true);
    expect(hasAnySettingsPermission({ ...NONE, permCacheReset: true })).toBe(true);
  });
});

describe("walksLandingPath", () => {
  it("goes to the admin Walks dashboard when granted Walks", () => {
    expect(walksLandingPath(FULL_ORGANISER_PERMISSIONS)).toBe("/admin");
    expect(walksLandingPath({ ...NONE, permWalksView: true })).toBe("/admin");
  });

  it("goes to the ordinary member Walks page otherwise", () => {
    expect(walksLandingPath(NONE)).toBe("/walks");
    expect(walksLandingPath({ ...NONE, permMembersView: true })).toBe("/walks");
  });
});

describe("describeOrganiserPermissions", () => {
  it("uses the short full-access phrasing when everything is granted", () => {
    expect(describeOrganiserPermissions(FULL_ORGANISER_PERMISSIONS)).toBe(
      "You'll have full access — everything an organiser can do on the site.",
    );
  });

  it("names only what's granted for a single permission", () => {
    const result = describeOrganiserPermissions({ ...NONE, permMembersView: true });
    expect(result).toBe(
      "You'll be able to see the member list, walk history, and resend or cancel an invite.",
    );
  });

  it("joins multiple granted permissions with a final 'and'", () => {
    const result = describeOrganiserPermissions({
      ...NONE,
      permWalksView: true,
      permWalksCreate: true,
      permWalksEdit: true,
      permWalksCancel: true,
      permWalksDelete: true,
      permWalksAttendance: true,
      permWalksHealth: true,
      permWalksJourney: true,
      permWalksExport: true,
      permCacheReset: true,
    });
    expect(
      result.startsWith("You'll be able to see the walks admin pages — schedule, roster counts, and journey log"),
    ).toBe(true);
    expect(result).toContain("; and clear the site cache, or reset the whole site back to its defaults.");
  });

  it("explains nothing was granted when every permission is false", () => {
    expect(describeOrganiserPermissions(NONE)).toBe(
      "No specific organiser tools were switched on for this invite — check with whoever invited you once you've accepted.",
    );
  });
});
