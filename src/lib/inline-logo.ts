import sharp from "sharp";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { SITE_SETTING_ID } from "@/lib/theme";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { DEFAULT_LOGO_INLINE } from "@/lib/default-logo-inline";

export type InlineLogo = { src: string; width: number; height: number };

/**
 * The header logo as a small picture built into the page (data: URL), so it
 * is there on the very first paint of every refresh. A normal image file —
 * even one the browser has saved — shows up a frame or two after the page.
 * An uploaded logo is shrunk to twice the header's 32px height (sharp, as
 * for uploaded photos); saving a new logo refreshes this with the theme.
 */
export async function getInlineLogo(): Promise<InlineLogo> {
  "use cache: remote";
  cacheTag(HOMEPAGE_CACHE_TAG);
  cacheLife({ revalidate: HOMEPAGE_REVALIDATE_SECONDS });
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { logoData: true, logoMime: true },
    });
    if (!row?.logoMime || !row.logoData) return DEFAULT_LOGO_INLINE;
    const { data, info } = await sharp(Buffer.from(row.logoData))
      .resize({ height: 64, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return { src: `data:image/webp;base64,${data.toString("base64")}`, width: info.width, height: info.height };
  } catch {
    return DEFAULT_LOGO_INLINE;
  }
}
