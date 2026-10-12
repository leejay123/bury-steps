import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { SITE_SETTING_ID } from "@/lib/theme";
import {
  parseWalkHeaderStyle,
  parseWalkPageLayout,
  type WalkHeaderStyle,
  type WalkPageLayout,
} from "@/lib/walk-page-sections";

/** Saving the walk page layout refreshes this tag only — walk pages, not the whole site. */
export const WALK_PAGE_CHOICE_TAG = "walk-page-choice";

/**
 * The walk page layout and header chosen in Settings → Site wording → Walk
 * page cards, as a saved copy of its own (not part of the site theme), so
 * that changing it refreshes only the pages that use it — the walk pages and
 * that settings page. With it in the site theme, every change rebuilt every
 * page on the site, each rebuild an ISR write on Vercel's free plan.
 */
export async function getWalkPageChoice(): Promise<{ layout: WalkPageLayout; header: WalkHeaderStyle }> {
  "use cache: remote";
  cacheTag(WALK_PAGE_CHOICE_TAG);
  cacheLife({ revalidate: HOMEPAGE_REVALIDATE_SECONDS });
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { walkPageLayout: true, walkHeaderStyle: true },
    });
    return { layout: parseWalkPageLayout(row?.walkPageLayout), header: parseWalkHeaderStyle(row?.walkHeaderStyle) };
  } catch {
    return { layout: "classic", header: "standard" };
  }
}

export type WalkDesignAudience = "organiser" | "member" | "visitor";
export type WalkDesigns = Partial<Record<WalkDesignAudience, unknown>>;

/** The designs saved in the walk page designer (Puck data per audience). */
export async function getWalkDesigns(): Promise<WalkDesigns> {
  "use cache: remote";
  cacheTag(WALK_PAGE_CHOICE_TAG);
  cacheLife({ revalidate: HOMEPAGE_REVALIDATE_SECONDS });
  try {
    const row = await prisma.siteSetting.findUnique({ where: { id: SITE_SETTING_ID }, select: { walkPageDesigns: true } });
    return row?.walkPageDesigns ? (JSON.parse(row.walkPageDesigns) as WalkDesigns) : {};
  } catch {
    return {};
  }
}
