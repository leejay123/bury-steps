import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CANCELLED_WALK_RETENTION_DAYS } from "@/lib/walk-retention";

/**
 * Retention job. Clears reported health information once the retention period
 * has passed, leaving the attendance record itself intact.
 * Also removes cancelled walks that were never reopened after 30 days.
 * Scheduled daily by vercel.json.
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

  const cancelledCutoff = new Date(
    Date.now() - CANCELLED_WALK_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  const { count: deletedCancelled } = await prisma.walk.deleteMany({
    where: { cancelledAt: { lte: cancelledCutoff } },
  });

  return NextResponse.json({ purged, deletedCancelled });
}
