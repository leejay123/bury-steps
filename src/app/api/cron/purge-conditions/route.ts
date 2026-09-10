import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";
import { SITE_SETTING_ID } from "@/lib/theme";

/**
 * Daily retention job, three jobs in one:
 * 1. Clears reported health information once the retention period has
 *    passed, leaving the attendance record itself intact.
 * 2. Removes a cancelled walk (and its attendances/journey events, via
 *    cascade — any linked accident report is unlinked, not deleted) once
 *    SiteSetting.cancelledWalkRetentionDays has passed since it was
 *    cancelled, unless it was reopened or flagged (retentionLocked).
 * 3. Removes an accident report once SiteSetting.accidentReportRetentionDays
 *    has passed since it was logged, unless flagged (retentionLocked).
 * Both 2 and 3 are opt-in via their setting (null = never auto-delete) —
 * only 2 was previously always-on, at a hardcoded 30 days.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const { count: purged } = await prisma.attendance.updateMany({
    where: { conditionsPurgeAfter: { lte: new Date() }, conditions: { not: null } },
    data: { conditions: null },
  });

  // One row, one query — getCancelledWalkRetentionDays()/
  // getAccidentReportRetentionDays() exist for callers that only need one
  // of these values; fetching both here directly avoids two round trips.
  const setting = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { cancelledWalkRetentionDays: true, accidentReportRetentionDays: true },
  });
  const cancelledWalkRetentionDays = setting
    ? setting.cancelledWalkRetentionDays
    : DEFAULT_CANCELLED_WALK_RETENTION_DAYS;
  const accidentReportRetentionDays = setting ? setting.accidentReportRetentionDays : null;

  let deletedCancelled = 0;
  if (cancelledWalkRetentionDays !== null) {
    const cancelledCutoff = new Date(
      Date.now() - cancelledWalkRetentionDays * 24 * 60 * 60 * 1000,
    );
    const result = await prisma.walk.deleteMany({
      where: { cancelledAt: { lte: cancelledCutoff }, retentionLocked: false },
    });
    deletedCancelled = result.count;
  }

  let deletedReports = 0;
  if (accidentReportRetentionDays !== null) {
    const reportCutoff = new Date(Date.now() - accidentReportRetentionDays * 24 * 60 * 60 * 1000);
    const result = await prisma.accidentReport.deleteMany({
      where: { createdAt: { lte: reportCutoff }, retentionLocked: false },
    });
    deletedReports = result.count;
  }

  return NextResponse.json({ purged, deletedCancelled, deletedReports });
}
