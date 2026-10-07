import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bearerMatches } from "@/lib/bearer-auth";
import { sendStartingSoonPush } from "@/lib/push-send";
import { vapidConfig } from "@/lib/vapid";
import { startingSoonPushWindow } from "@/lib/walk-push";

/**
 * Phone alert about an hour before each walk, for members who turned alerts
 * on. A job that stays awake calls this about every 15 minutes. The walk
 * stays open until it starts, so a phone that failed, or was turned on
 * during that hour, is included on a later look. Nothing goes out after
 * the start time.
 */
export async function GET(req: Request) {
  if (!bearerMatches(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new NextResponse("Unauthorised", { status: 401 });
  }
  if (!vapidConfig()) {
    return NextResponse.json({ skipped: true, reason: "no-vapid" });
  }

  const now = new Date();
  const window = startingSoonPushWindow(now);
  const walks = await prisma.walk.findMany({
    where: {
      cancelledAt: null,
      startingSoonPushSentAt: null,
      startsAt: { gt: window.from, lte: window.until },
    },
    select: { id: true, title: true, startsAt: true, slug: true, token: true },
    orderBy: { startsAt: "asc" },
  });

  const results: { id: string; sent: number; failed: number; removed: number }[] = [];
  for (const walk of walks) {
    const result = await sendStartingSoonPush(walk);
    results.push({ id: walk.id, ...result });
  }

  return NextResponse.json({ walks: results });
}
