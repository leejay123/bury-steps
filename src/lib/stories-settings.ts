import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { prisma } from "./db";
import { SITE_SETTING_ID } from "./theme";

/**
 * Site-wide switch for stories (Settings → Site behaviour, and
 * updateStoriesEnabled). When false the stories row is hidden on the walks
 * pages and no new stories can be posted. Defaults true.
 */
export const getStoriesEnabled = cache(async (): Promise<boolean> => {
  try {
    return await getCachedStoriesEnabled();
  } catch {
    // Build-time prerendering has no database: the schema's default.
    return true;
  }
});

/** A saved copy shared by every server (refreshed when the switch is saved). */
async function getCachedStoriesEnabled(): Promise<boolean> {
  "use cache: remote";
  cacheTag(HOMEPAGE_CACHE_TAG);
  cacheLife({ revalidate: HOMEPAGE_REVALIDATE_SECONDS });
  const setting = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { storiesEnabled: true },
  });
  return setting?.storiesEnabled ?? true;
}
