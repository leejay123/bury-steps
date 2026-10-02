const HOMEPAGE_SECTION_IDS = [
  "photos",
  "howWalksWork",
  "howThisStarted",
  "memberNotices",
  "testimonials",
  "walkApps",
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
  walkApps: "Apps for our walks",
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
 * until an organiser moves them — except Apps for our walks, which goes
 * just above the FAQs (or last), not straight under the hero. */
export function normalizeHomepageSectionOrder(raw: string | null | undefined): HomepageSectionId[] {
  const text = raw?.trim() ?? "";
  const parsed = parseHomepageSectionOrder(text);
  if (parsed !== "invalid") return parsed;
  const saved = text.split(",").map((part) => part.trim()).filter(Boolean);
  const missing = HOMEPAGE_SECTION_IDS.filter((id) => !saved.includes(id) && id !== "walkApps");
  const merged = [...missing, ...saved];
  if (!saved.includes("walkApps")) {
    const faqs = merged.indexOf("faqs");
    merged.splice(faqs === -1 ? merged.length : faqs, 0, "walkApps");
  }
  const upgraded = parseHomepageSectionOrder(merged.join(","));
  return upgraded === "invalid" ? DEFAULT_HOMEPAGE_SECTION_ORDER : upgraded;
}

export function serializeHomepageSectionOrder(order: readonly HomepageSectionId[]): string {
  return order.join(",");
}
