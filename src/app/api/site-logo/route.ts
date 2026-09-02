import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { sniffImageMime } from "@/lib/image-bytes";

export const preferredRegion = ["lhr1"];

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { logoData: true },
  });

  if (!setting?.logoData || setting.logoData.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Byte-sniff at serve time rather than trusting the stored `logoMime`
  // column — defense-in-depth so a stale/incorrect DB value can never make
  // this serve one content type's bytes labelled as another.
  const sniffed = sniffImageMime(setting.logoData);
  if (!sniffed) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(Buffer.from(setting.logoData), {
    headers: {
      "Content-Type": sniffed,
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
