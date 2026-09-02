import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { sniffImageMime } from "@/lib/image-bytes";

export const dynamic = "force-dynamic";

/**
 * Serves the browser-tab favicon. An admin-uploaded favicon (stored on
 * `SiteSetting`) wins; otherwise this falls back to the bundled default in
 * `public/default-favicon.png`. Named as a directory (rather than a plain
 * `icon.png` file) so it can query the database — see `icon-192.png/route.tsx`
 * for the same pattern used for the PWA icons.
 */
export async function GET() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { faviconData: true },
  });

  if (setting?.faviconData && setting.faviconData.length > 0) {
    // Byte-sniff at serve time rather than trusting the stored mime column —
    // defense-in-depth so a stale/incorrect DB value can never make this
    // serve one content type's bytes labelled as another.
    const sniffed = sniffImageMime(setting.faviconData);
    if (sniffed) {
      return new NextResponse(Buffer.from(setting.faviconData), {
        headers: {
          "Content-Type": sniffed,
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
  }

  const fallback = await readFile(path.join(process.cwd(), "public/default-favicon.png"));
  return new NextResponse(fallback, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
