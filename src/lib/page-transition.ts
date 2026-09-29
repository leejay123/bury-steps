/** How the page content animates on a page change (Site behaviour). */
const PAGE_TRANSITIONS = ["fade", "slide", "none"] as const;
export type PageTransition = (typeof PAGE_TRANSITIONS)[number];

export function parsePageTransition(raw: string | null | undefined): PageTransition {
  return (PAGE_TRANSITIONS as readonly string[]).includes(raw ?? "") ? (raw as PageTransition) : "fade";
}
