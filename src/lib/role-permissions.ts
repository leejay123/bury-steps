import { cache } from "react";
import { prisma } from "./db";
import { isOwner } from "./site-owner";
import { FULL_ORGANISER_PERMISSIONS, type OrganiserPermissions } from "./organiser-permissions";

/** The one row this table ever has. */
export const ROLE_PERMISSIONS_ID = "organiser";

/**
 * The one shared set of capabilities every organiser has — see
 * src/lib/organiser-permissions.ts. Cached per request (React's `cache`,
 * not a Next data-cache tag) so a page that checks several permissions
 * only runs one query. Falls back to full access if the row is somehow
 * missing (a fresh install before its first save) or unreachable at build
 * time — same fallback convention as getSiteTheme/getProgressEnabled.
 */
export const getOrganiserRolePermissions = cache(async (): Promise<OrganiserPermissions> => {
  try {
    const row = await prisma.rolePermissions.findUnique({ where: { id: ROLE_PERMISSIONS_ID } });
    if (!row) return FULL_ORGANISER_PERMISSIONS;
    return {
      permWalksView: row.permWalksView,
      permWalksCreate: row.permWalksCreate,
      permWalksEdit: row.permWalksEdit,
      permWalksCancel: row.permWalksCancel,
      permWalksAttendance: row.permWalksAttendance,
      permWalksHealth: row.permWalksHealth,
      permWalksJourney: row.permWalksJourney,
      permWalksExport: row.permWalksExport,
      permMembersView: row.permMembersView,
      permMessages: row.permMessages,
      permReportsView: row.permReportsView,
      permReportsEdit: row.permReportsEdit,
      permReportsCreate: row.permReportsCreate,
      permHomepage: row.permHomepage,
      permNotices: row.permNotices,
      permProgress: row.permProgress,
      permEmails: row.permEmails,
      permSubscribers: row.permSubscribers,
      permDisplay: row.permDisplay,
      permCacheReset: row.permCacheReset,
    };
  } catch {
    return FULL_ORGANISER_PERMISSIONS;
  }
});

/**
 * What one signed-in ADMIN can actually do — the site owner always has
 * full access regardless of the shared Organiser role (see
 * src/lib/site-owner.ts); anyone else gets exactly the shared role's
 * current settings. Cached per request per the above.
 */
export async function resolveOrganiserPermissions(userId: string): Promise<OrganiserPermissions> {
  if (await isOwner(userId)) return FULL_ORGANISER_PERMISSIONS;
  return getOrganiserRolePermissions();
}
