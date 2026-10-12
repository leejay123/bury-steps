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

/**
 * How a walk's page is laid out (Settings → Site wording → Walk page cards),
 * the same for members and organisers: "classic" is one column, everything
 * stacked; "columns" puts the details and the sections (in tabs) on the
 * left and the clock-in, share link and organiser buttons in a right-hand
 * column that stays in view on a computer. The rest are one column with
 * tabs (walk-tabs-layout.tsx): "strip" (A, a row of actions under the
 * title), "sticky" (B, a tab bar that stays at the top), "status" (C, what's
 * happening now first) and "tiles" (D, summary boxes that open their tab).
 */
/**
 * The 20 further designs (walk-idea-layouts.tsx), in the order of the
 * Layout list, with their names there.
 */
export const WALK_IDEA_LAYOUTS = [
  { id: "minimal", label: "Minimal document" },
  { id: "maphero", label: "Map hero" },
  { id: "timeline", label: "Day timeline" },
  { id: "ticket", label: "Walk ticket" },
  { id: "bignumbers", label: "Big numbers" },
  { id: "mapside", label: "Map beside details" },
  { id: "rail", label: "Side tab rail" },
  { id: "folded", label: "Everything folded" },
  { id: "phases", label: "Before · During · After" },
  { id: "sheet", label: "Phone app sheet" },
  { id: "calendar", label: "Calendar entry" },
  { id: "checklist", label: "Checklist first" },
  { id: "people", label: "People first" },
  { id: "weather", label: "Weather first" },
  { id: "magazine", label: "Magazine" },
  { id: "dark", label: "Dark header" },
  { id: "stepper", label: "Progress stepper" },
  { id: "actions", label: "Action search bar" },
  { id: "bento", label: "Bento grid" },
  { id: "spec", label: "Spec sheet" },
] as const;
export type WalkIdeaLayout = (typeof WALK_IDEA_LAYOUTS)[number]["id"];

export const WALK_PAGE_LAYOUTS = [
  "classic",
  "columns",
  "strip",
  "sticky",
  "status",
  "tiles",
  ...WALK_IDEA_LAYOUTS.map((idea) => idea.id),
] as const;
export type WalkPageLayout = "classic" | "columns" | "strip" | "sticky" | "status" | "tiles" | WalkIdeaLayout;
/** The one-column-with-tabs designs, A to D. */
export type WalkTabsVariant = "strip" | "sticky" | "status" | "tiles";

export function parseWalkPageLayout(value: string | null | undefined): WalkPageLayout {
  return (WALK_PAGE_LAYOUTS as readonly string[]).includes(value ?? "") ? (value as WalkPageLayout) : "classic";
}

export function isWalkTabsVariant(layout: WalkPageLayout): layout is WalkTabsVariant {
  return layout === "strip" || layout === "sticky" || layout === "status" || layout === "tiles";
}

export function isWalkIdeaLayout(layout: WalkPageLayout): layout is WalkIdeaLayout {
  return WALK_IDEA_LAYOUTS.some((idea) => idea.id === layout);
}

/**
 * The title and the walk's controls at the top of the tabbed layouts (A to
 * D): "standard" (the title line; controls where the layout puts them),
 * "buttons" (H1, the controls beside the title, the rest under ⋯ More),
 * "toolbar" (H2, a bar of controls above a big title and four key facts),
 * "band" (H3, a box with a coloured status band and one Manage menu) or
 * "grouped" (H4, the controls in two boxes: You, and Organise this walk).
 */
export const WALK_HEADER_STYLES = ["standard", "buttons", "toolbar", "band", "grouped"] as const;
export type WalkHeaderStyle = (typeof WALK_HEADER_STYLES)[number];

export function parseWalkHeaderStyle(value: string | null | undefined): WalkHeaderStyle {
  return (WALK_HEADER_STYLES as readonly string[]).includes(value ?? "") ? (value as WalkHeaderStyle) : "standard";
}
