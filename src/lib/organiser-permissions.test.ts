import { describe, expect, it } from "vitest";
import {
  describeOrganiserPermissions,
  FULL_ORGANISER_PERMISSIONS,
  hasAnySettingsPermission,
  hasFullAccess,
  ORGANISER_PERMISSION_OPTIONS,
  type OrganiserPermissions,
  walksLandingPath,
} from "./organiser-permissions";

const NONE: OrganiserPermissions = ORGANISER_PERMISSION_OPTIONS.reduce((acc, option) => {
  acc[option.name] = false;
  return acc;
}, {} as OrganiserPermissions);

describe("hasFullAccess", () => {
  it("is true only when every permission is granted", () => {
    expect(hasFullAccess(FULL_ORGANISER_PERMISSIONS)).toBe(true);
    expect(hasFullAccess({ ...FULL_ORGANISER_PERMISSIONS, permCacheReset: false })).toBe(false);
    expect(hasFullAccess(NONE)).toBe(false);
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
        permReportsView: true,
      }),
    ).toBe(false);
  });

  it("is true when any one settings-area permission is granted", () => {
    expect(hasAnySettingsPermission({ ...NONE, permHomepage: true })).toBe(true);
    expect(hasAnySettingsPermission({ ...NONE, permCacheReset: true })).toBe(true);
  });
});

describe("walksLandingPath", () => {
  it("goes to the admin Walks dashboard when granted View or Create", () => {
    expect(walksLandingPath(FULL_ORGANISER_PERMISSIONS)).toBe("/admin");
    expect(walksLandingPath({ ...NONE, permWalksView: true })).toBe("/admin");
    expect(walksLandingPath({ ...NONE, permWalksCreate: true })).toBe("/admin");
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
      permWalksAttendance: true,
      permWalksHealth: true,
      permWalksJourney: true,
      permWalksExport: true,
      permCacheReset: true,
    });
    expect(
      result.startsWith(
        "You'll be able to see the walks admin pages — schedule, roster counts, journey log, and cancelled walks",
      ),
    ).toBe(true);
    expect(result).toContain("; and clear the site cache, or reset the whole site back to its defaults.");
  });

  it("explains nothing was granted when every permission is false", () => {
    expect(describeOrganiserPermissions(NONE)).toBe(
      "No organiser tools are currently switched on — check with whoever invited you once you've accepted.",
    );
  });
});
