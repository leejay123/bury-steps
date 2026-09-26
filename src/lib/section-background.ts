const SECTION_BG_PATTERNS = ["none", "dots", "grid", "cross", "diagonal"] as const;

export type SectionBgPattern = (typeof SECTION_BG_PATTERNS)[number];

export const SECTION_BG_PATTERN_LABELS: Record<SectionBgPattern, string> = {
  none: "None (leave as is)",
  dots: "Dot grid",
  grid: "Grid lines",
  cross: "Crosses",
  diagonal: "Diagonal lines",
};

export function parseSectionBgPattern(
  raw: string | null | undefined,
  fallback: SectionBgPattern = "none",
): SectionBgPattern {
  return (SECTION_BG_PATTERNS as readonly string[]).includes(raw ?? "")
    ? (raw as SectionBgPattern)
    : fallback;
}

/** Which SiteSetting column backs each homepage section's pattern choice —
 * shared between the settings form (one action for all five) and
 * site-theme.ts (loading/defaults). howWalksWork has no picker (not asked
 * for), so it isn't in this list. */
export const SECTION_BG_KEYS = [
  "hero",
  "howThisStarted",
  "testimonials",
  "memberNotices",
  "faqs",
] as const;

export type SectionBgKey = (typeof SECTION_BG_KEYS)[number];

/** Hero already showed a dot grid unconditionally before this setting
 * existed — default it to "dots" so nothing changes for existing installs.
 * Every other section had no pattern at all, so they default to "none". */
export const SECTION_BG_DEFAULTS: Record<SectionBgKey, SectionBgPattern> = {
  hero: "dots",
  howThisStarted: "none",
  testimonials: "none",
  memberNotices: "none",
  faqs: "none",
};

/** SiteSetting column name backing each section's pattern choice. */
export const SECTION_BG_COLUMNS: Record<SectionBgKey, string> = {
  hero: "heroBgPattern",
  howThisStarted: "howThisStartedBgPattern",
  testimonials: "testimonialsBgPattern",
  memberNotices: "memberNoticesBgPattern",
  faqs: "faqsBgPattern",
};

export const SECTION_BG_LABELS: Record<SectionBgKey, string> = {
  hero: "Hero",
  howThisStarted: "How this started",
  testimonials: "Testimonials",
  memberNotices: "Latest notices",
  faqs: "FAQs",
};
