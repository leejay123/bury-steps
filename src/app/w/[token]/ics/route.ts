import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildWalkIcs, walkIcsFilename } from "@/lib/walk-ics";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const walk = await prisma.walk.findFirst({
    where: { OR: [{ token }, { slug: token }] },
    select: {
      title: true,
      description: true,
      location: true,
      postcode: true,
      startsAt: true,
      durationMins: true,
      token: true,
      slug: true,
      cancelledAt: true,
    },
  });

  if (!walk) return new NextResponse("Not found", { status: 404 });
  if (walk.cancelledAt) {
    return new NextResponse("This walk has been cancelled.", { status: 404 });
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
