/** How the page content animates on a page change (Site behaviour). */
const PAGE_TRANSITIONS = ["fade", "slide", "none"] as const;
export type PageTransition = (typeof PAGE_TRANSITIONS)[number];

export function parsePageTransition(raw: string | null | undefined): PageTransition {
  return (PAGE_TRANSITIONS as readonly string[]).includes(raw ?? "") ? (raw as PageTransition) : "fade";
}

/** A single walk's page — organiser (/admin/walks/<id>) or member (/w/<slug>). */
const isWalkPage = (path: string) => /^\/(admin\/walks|w)\/[^/]+$/.test(path);

/** Main sections: everything else sits "inside" these addresses, so they
 * don't count as a parent (Walks → Settings is a move sideways, not deeper). */
const SECTION_ROOTS = new Set(["/", "/admin"]);

/** `to` is a page inside `from`: /admin/settings → /admin/settings/branding. */
const isInside = (to: string, from: string) => !SECTION_ROOTS.has(from) && to.startsWith(`${from}/`);

/**
 * +1 going deeper (a list → one thing in it: Settings → Branding, Notices →
 * a notice, Members → a member, Walks → a walk), -1 coming back out, 0 a move
 * sideways (between main sections, or Branding → Site behaviour). Walks are
 * the special case: /w/<slug> doesn't sit inside the walks list's address.
 */
export function slideDirection(from: string, to: string): -1 | 0 | 1 {
  if (!isWalkPage(from) && isWalkPage(to)) return 1;
  if (isWalkPage(from) && !isWalkPage(to)) return -1;
  if (isInside(to, from)) return 1;
  if (isInside(from, to)) return -1;
  return 0;
}
