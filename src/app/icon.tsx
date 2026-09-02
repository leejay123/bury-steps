import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { sniffImageMime } from "@/lib/image-bytes";

/**
 * Serves the browser-tab favicon. This must be a literal `icon.tsx` file
 * (Next's dynamic-icon file convention) rather than a route handler at some
 * other path — only this convention makes Next auto-inject the
 * `<link rel="icon">` tag into every page's head. A route.tsx living at a
 * directory named "icon.png" (the earlier version of this file) serves the
 * bytes fine if you hit its URL directly, but Next never wires it up as the
 * page's favicon, so browsers fall back to a generic globe icon.
 *
 * An admin-uploaded favicon (stored on `SiteSetting`) wins; otherwise this
 * falls back to the bundled default in `public/default-favicon.png`.
 */
export const dynamic = "force-dynamic";
export const contentType = "image/png";

export default async function Icon() {
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
      return new Response(Buffer.from(setting.faviconData), {
        headers: { "Content-Type": sniffed },
      });
    }
  }

  const fallback = await readFile(path.join(process.cwd(), "public/default-favicon.png"));
  return new Response(fallback, { headers: { "Content-Type": "image/png" } });
}
