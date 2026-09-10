import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";

/**
 * Fallback used only for a brand-new SiteSetting row that predates this
 * column (the migration backfills existing rows to this same value, so
 * this isn't actually reached in practice) and the admin settings form's
 * placeholder text. The live, admin-configurable value always comes from
 * getCancelledWalkRetentionDays() below — nothing else should import this.
 */
export const DEFAULT_CANCELLED_WALK_RETENTION_DAYS = 30;

/**
 * Days a cancelled walk (never reopened) is kept before the daily cron
 * (src/app/api/cron/purge-conditions) deletes it, along with its
 * attendances — see SiteSetting.cancelledWalkRetentionDays. Null means
 * auto-delete is off. Used both by the cron itself and by the "recently
 * cancelled" display window on the member dashboard, so a cancelled walk
 * never shows there for longer than it will actually continue to exist.
 */
export async function getCancelledWalkRetentionDays(): Promise<number | null> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { cancelledWalkRetentionDays: true },
  });
  // `?? DEFAULT` would be wrong here — an admin deliberately turning this
  // off saves an explicit null on the row, which must stay null, not get
  // silently coerced back to the default. Only a genuinely missing row
  // (no SiteSetting written yet at all) falls back.
  if (!row) return DEFAULT_CANCELLED_WALK_RETENTION_DAYS;
  return row.cancelledWalkRetentionDays;
}

/**
 * Days an accident report is kept (counted from when it was logged) before
 * the daily cron deletes it — see SiteSetting.accidentReportRetentionDays.
 * Null (the default) means auto-delete is off.
 */
export async function getAccidentReportRetentionDays(): Promise<number | null> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { accidentReportRetentionDays: true },
  });
  return row ? row.accidentReportRetentionDays : null;
}
