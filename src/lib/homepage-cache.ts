export const HOMEPAGE_CACHE_TAG = "homepage";
/** How long a saved copy (site settings, hero photos, FAQs, testimonials,
 * notices) is kept before it's rebuilt anyway. Saving any of them refreshes
 * it at once (revalidateTag), so this is only a safety net. It also sets how
 * often each ready-made page is rebuilt: at 2 minutes every page rebuilt
 * itself all day, each rebuild hitting the database, which ran the
 * database out of connections. */
export const HOMEPAGE_REVALIDATE_SECONDS = 24 * 60 * 60;
