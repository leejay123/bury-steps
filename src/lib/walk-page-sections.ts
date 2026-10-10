/**
 * The shared sections on a walk's page (members' and organisers'), under the
 * details card, in the order chosen in Settings → Site wording → Walk page
 * cards. Stored as "before,map,-forecast,precise": a leading "-" hides that
 * section. Before you set off only shows on the members' page, and has its
 * own on/off switch (beforeYouSetOffEnabled).
 */
export const WALK_PAGE_SECTION_IDS = ["before", "map", "forecast", "precise"] as const;

export type WalkPageSectionId = (typeof WALK_PAGE_SECTION_IDS)[number];

export type WalkPageSection = { id: WalkPageSectionId; visible: boolean };

export const WALK_PAGE_SECTION_LABELS: Record<WalkPageSectionId, string> = {
  before: "Before you set off",
  map: "Meeting point map",
  forecast: "7-day forecast",
  precise: "Precise location (what3words)",
};

export const DEFAULT_WALK_PAGE_SECTIONS_TEXT = WALK_PAGE_SECTION_IDS.join(",");

/** Any order saved before a section existed keeps working: unknown ids drop, missing ones go last, shown. */
export function parseWalkPageSections(raw: string | null | undefined): WalkPageSection[] {
  const seen = new Set<WalkPageSectionId>();
  const out: WalkPageSection[] = [];
  for (const part of (raw ?? DEFAULT_WALK_PAGE_SECTIONS_TEXT).split(",")) {
    const token = part.trim();
    const hidden = token.startsWith("-");
    const id = (hidden ? token.slice(1) : token) as WalkPageSectionId;
    if (!WALK_PAGE_SECTION_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, visible: !hidden || id === "before" });
  }
  for (const id of WALK_PAGE_SECTION_IDS) if (!seen.has(id)) out.push({ id, visible: true });
  return out;
}

export function serializeWalkPageSections(sections: WalkPageSection[]): string {
  return sections.map(({ id, visible }) => (visible || id === "before" ? id : `-${id}`)).join(",");
}
