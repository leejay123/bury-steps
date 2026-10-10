/**
 * How long a page's personal part is kept as a "use cache: private" saved
 * copy: in the browser only, never on the server. Five minutes is the
 * shortest a page fetched ahead can carry (Next.js leaves anything shorter
 * out of a page's ready-made outline), and any save refreshes it at once.
 * See node_modules/next/dist/docs/01-app/02-guides/optimizing-prefetching.md.
 */
export const PRIVATE_SAVED_COPY = { stale: 300, revalidate: 300, expire: 3600 };
