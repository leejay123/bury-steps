import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { prisma } from "./db";
import { SITE_SETTING_ID } from "./theme";

/**
 * Site-wide switch for the /progress page (see the toggle in
 * Settings → Site behaviour, and updateProgressEnabled). When
 * false, /progress 404s for everyone — organisers included, not just
 * members — and the nav drops the link. Defaults true, so a row that
 * predates this column (or a SiteSetting that hasn't been created at
 * all yet) still shows Progress.
 *
 * A shared saved copy (see getCachedProgressEnabled), also deduplicated
 * per request with React's `cache`.
 */
export const getProgressEnabled = cache(async (): Promise<boolean> => {
  try {
    return await getCachedProgressEnabled();
  } catch {
    // Same fallback as getSiteTheme — build-time prerendering (e.g.
    // /_not-found) has no real database to reach, so default to the
    // schema's own default rather than fail the whole build.
    return true;
  }
});

/** A saved copy shared by every server (refreshed when the switch is
 * saved), so the homepage and nav don't ask the database each time. */
async function getCachedProgressEnabled(): Promise<boolean> {
  "use cache: remote";
  cacheTag(HOMEPAGE_CACHE_TAG);
  cacheLife({ revalidate: HOMEPAGE_REVALIDATE_SECONDS });
  const setting = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: { progressEnabled: true },
  });
  return setting?.progressEnabled ?? true;
}
