import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Retention job. Clears reported health information once the retention period
 * has passed, leaving the attendance record itself intact.
 * Scheduled daily by vercel.json.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorised", { status: 401 });
  }

  const { count } = await prisma.attendance.updateMany({
    where: { conditionsPurgeAfter: { lte: new Date() }, conditions: { not: null } },
    data: { conditions: null },
  });

  return NextResponse.json({ purged: count });
}
