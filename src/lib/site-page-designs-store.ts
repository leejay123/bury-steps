import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { SITE_SETTING_ID } from "@/lib/theme";
import {
  emptySitePageDesigns,
  parseSitePageDesigns,
  publishedDesign,
  SITE_PAGE_DESIGNS_TAG,
  type PuckData,
  type SitePageDesigns,
  type SitePageKey,
} from "./site-page-designs";

/** The saved designs for every public page the designer can edit. */
export async function getSitePageDesigns(): Promise<SitePageDesigns> {
  "use cache: remote";
  cacheTag(SITE_PAGE_DESIGNS_TAG);
  cacheLife({ revalidate: HOMEPAGE_REVALIDATE_SECONDS });
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { sitePageDesigns: true },
    });
    return parseSitePageDesigns(row?.sitePageDesigns);
  } catch {
    return emptySitePageDesigns();
  }
}

export async function getPublishedSitePageDesign(page: SitePageKey): Promise<PuckData | null> {
  const designs = await getSitePageDesigns();
  return publishedDesign(designs[page]);
}
