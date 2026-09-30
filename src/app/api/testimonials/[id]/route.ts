import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sniffImageMime } from "@/lib/image-bytes";
import { needsOptimising, optimisePhoto } from "@/lib/optimise-photo";

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

  // Photos uploaded before uploads were shrunk (up to 4 MB each) are
  // shrunk the first time they're asked for and saved back, so the old
  // ones get lighter too without anyone re-uploading them.
  let bytes: Uint8Array = row.imageData;
  let type: string = sniffed;
  if (needsOptimising(bytes, sniffed)) {
    try {
      bytes = await optimisePhoto(bytes);
      type = "image/webp";
      await prisma.homepageTestimonial.update({ where: { id }, data: { imageData: bytes as Uint8Array<ArrayBuffer>, imageMime: type } });
    } catch (err) {
      console.error("Could not shrink stored photo", id, err);
      bytes = row.imageData;
      type = sniffed;
    }
  }

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
