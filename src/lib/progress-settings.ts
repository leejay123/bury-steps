import { cache } from "react";
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
 * Cached per request (React's `cache`, not a Next data-cache tag) so the
 * nav and the Progress page itself share one lookup instead of each
 * running their own query.
 */
export const getProgressEnabled = cache(async (): Promise<boolean> => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { progressEnabled: true },
    });
    return setting?.progressEnabled ?? true;
  } catch {
    // Same fallback as getSiteTheme — build-time prerendering (e.g.
    // /_not-found) has no real database to reach, so default to the
    // schema's own default rather than fail the whole build.
    return true;
  }
});
