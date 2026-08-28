import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sniffImageMime } from "@/lib/image-bytes";

export const preferredRegion = ["lhr1"];

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

  // Byte-sniff at serve time rather than trusting the stored `imageMime`
  // column — defense-in-depth so a stale/incorrect DB value can never make
  // this serve one content type's bytes labelled as another.
  const sniffed = sniffImageMime(row.imageData);
  if (!sniffed) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Buffer.from(row.imageData), {
    headers: {
      "Content-Type": sniffed,
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
