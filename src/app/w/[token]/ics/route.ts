import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { findWalkIdBySlugCode } from "@/lib/walk-slug-server";
import { buildWalkIcs, walkIcsFilename } from "@/lib/walk-ics";
import { canAddWalkToCalendar } from "@/lib/walk-window";


export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const select = {
    id: true,
    title: true,
    description: true,
    location: true,
    postcode: true,
    startsAt: true,
    durationMins: true,
    token: true,
    slug: true,
    endedAt: true,
    cancelledAt: true,
  } satisfies Prisma.WalkSelect;
  let walk = await prisma.walk.findFirst({ where: { OR: [{ token }, { slug: token }] }, select });
  if (!walk) {
    // Added from a link posted before the walk was renamed.
    const id = await findWalkIdBySlugCode(token);
    if (id) walk = await prisma.walk.findUnique({ where: { id }, select });
  }

  // Same 404 body for missing, cancelled, and completed — no calendar oracle.
  if (!walk || !canAddWalkToCalendar(walk)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ics = buildWalkIcs(walk);
  const filename = walkIcsFilename(walk.startsAt);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
