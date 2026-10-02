const HOMEPAGE_SECTION_IDS = [
  "photos",
  "howWalksWork",
  "howThisStarted",
  "memberNotices",
  "testimonials",
  "faqs",
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];

export const DEFAULT_HOMEPAGE_SECTION_ORDER: HomepageSectionId[] = [...HOMEPAGE_SECTION_IDS];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionId, string> = {
  photos: "Photo slider",
  howWalksWork: "How walks work",
  howThisStarted: "How this started",
  memberNotices: "Latest notices (members)",
  testimonials: "Testimonials",
  faqs: "FAQs",
};

export const DEFAULT_HOMEPAGE_SECTION_ORDER_TEXT = DEFAULT_HOMEPAGE_SECTION_ORDER.join(",");

export function parseHomepageSectionOrder(raw: string): HomepageSectionId[] | "invalid" {
  const ids = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (ids.length !== HOMEPAGE_SECTION_IDS.length) return "invalid";
  const set = new Set(ids);
  if (set.size !== HOMEPAGE_SECTION_IDS.length) return "invalid";
  for (const id of ids) {
    if (!HOMEPAGE_SECTION_IDS.includes(id as HomepageSectionId)) return "invalid";
  }
  return ids as HomepageSectionId[];
}

/** Sections added after an order was saved go first, so the page they were
 * on before (the photo slider sat straight under the hero) doesn't change
 * until an organiser moves them. */
export function normalizeHomepageSectionOrder(raw: string | null | undefined): HomepageSectionId[] {
  const text = raw?.trim() ?? "";
  const parsed = parseHomepageSectionOrder(text);
  if (parsed !== "invalid") return parsed;
  const saved = text.split(",").map((part) => part.trim()).filter(Boolean);
  // Sections that no longer exist (e.g. Apps for our walks, now its own
  // page) are dropped rather than invalidating the whole saved order.
  const known = saved.filter((id) => (HOMEPAGE_SECTION_IDS as readonly string[]).includes(id));
  const missing = HOMEPAGE_SECTION_IDS.filter((id) => !known.includes(id));
  const upgraded = parseHomepageSectionOrder([...missing, ...known].join(","));
  return upgraded === "invalid" ? DEFAULT_HOMEPAGE_SECTION_ORDER : upgraded;
}

export function serializeHomepageSectionOrder(order: readonly HomepageSectionId[]): string {
  return order.join(",");
}
