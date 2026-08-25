import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await prisma.homepageTestimonial.findUnique({
    where: { id },
    select: { imageData: true, imageMime: true },
  });

  if (!row?.imageData || row.imageData.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Buffer.from(row.imageData), {
    headers: {
      "Content-Type": row.imageMime ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
