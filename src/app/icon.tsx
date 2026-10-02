import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
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

/** A browser tab shows the icon at 16–32px; 64px covers sharp screens. The
 * uploaded file (often a large logo) was sent as-is — about 95 KB, every
 * page — and is now shrunk to a few KB. */
const ICON_PX = 64;
// Kept a day in browsers and Vercel's cache; a changed favicon shows up
// within a day without anyone having to clear anything.
const CACHE = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

async function small(bytes: Uint8Array): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    return await sharp(bytes, { failOn: "none" })
      .resize(ICON_PX, ICON_PX, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer()
      .then((buffer) => new Uint8Array(buffer) as Uint8Array<ArrayBuffer>);
  } catch {
    return null;
  }
}

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
      const png = await small(setting.faviconData);
      return new Response(png ?? new Uint8Array(setting.faviconData), {
        headers: { "Content-Type": png ? "image/png" : sniffed, "Cache-Control": CACHE },
      });
    }
  }

  const fallback = await readFile(path.join(process.cwd(), "public/default-favicon.png"));
  const png = await small(fallback);
  return new Response(png ?? new Uint8Array(fallback), { headers: { "Content-Type": "image/png", "Cache-Control": CACHE } });
}
