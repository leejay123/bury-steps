import { cacheLife, cacheTag } from "next/cache";

/** Refreshed by every save (see src/lib/revalidate.ts). */
export const SITE_VERSION_TAG = "site-version";

/**
 * A fingerprint of "the last time anything on the site was saved" — the
 * moment this shared copy was made, which happens again after every save.
 * Open pages ask for it every so often (LiveUpdates) and, when it has
 * changed, refresh themselves so nobody needs to reload to see something
 * new. One copy shared by every server; it never touches the database.
 */
export async function getSiteVersion(): Promise<string> {
  "use cache: remote";
  cacheTag(SITE_VERSION_TAG);
  cacheLife("max");
  return Date.now().toString(36);
}
