export const HOMEPAGE_SECTION_IDS = [
  "howWalksWork",
  "howThisStarted",
  "memberNotices",
  "testimonials",
  "faqs",
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];

export const DEFAULT_HOMEPAGE_SECTION_ORDER: HomepageSectionId[] = [...HOMEPAGE_SECTION_IDS];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionId, string> = {
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

export function normalizeHomepageSectionOrder(raw: string | null | undefined): HomepageSectionId[] {
  const parsed = parseHomepageSectionOrder(raw?.trim() ?? "");
  return parsed === "invalid" ? DEFAULT_HOMEPAGE_SECTION_ORDER : parsed;
}

export function serializeHomepageSectionOrder(order: readonly HomepageSectionId[]): string {
  return order.join(",");
}
