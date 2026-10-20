/**
 * Small rules about saved walk page designs, shared by the designer's
 * blocks and the walk page's loading placeholder (plain code, so the
 * placeholder needs no extra download).
 */

/** The facts looks that were taken out show as the plain facts instead. */
const REMOVED_FACT_LOOKS = [
  "ticket",
  "ticket-colour",
  "badges",
  "receipt",
  "numbered",
  "big-first",
  "vertical-timeline",
  "two-tone-rows",
];

/** What can go inside the Details card's title box, under the name. */
export type TitlePart =
  | "facts"
  | "essentials"
  | "precise"
  | "timeline"
  | "description"
  | "map"
  | "clockin"
  | "countdown";
const TITLE_PARTS: readonly string[] = [
  "facts",
  "essentials",
  "precise",
  "timeline",
  "description",
  "map",
  "clockin",
  "countdown",
];

/**
 * The parts inside the title box, in order (each once). Pages saved before
 * the list existed are read from their old settings (facts / timeline /
 * description "inside the title box" and the order menu).
 */
export function titlePartsOf(o: {
  titleParts?: { part?: string }[];
  factsAt?: string;
  titleLook?: string;
  timeline?: boolean;
  timelineAt?: string;
  descriptionAt?: string;
  showDescription?: boolean;
  titleOrder?: string;
}): TitlePart[] {
  const listed = Array.isArray(o.titleParts)
    ? o.titleParts.map((item) => String(item?.part ?? ""))
    : (o.titleOrder ?? "facts,timeline,description")
        .split(",")
        .filter((key) =>
          key === "facts"
            ? o.factsAt === "title" ||
              o.titleLook === "chips" ||
              o.titleLook === "stats"
            : key === "timeline"
              ? Boolean(o.timeline) && o.timelineAt === "title"
              : key === "description"
                ? o.showDescription !== false && o.descriptionAt === "title"
                : false,
        );
  return listed.filter(
    (key, i) => TITLE_PARTS.includes(key) && listed.indexOf(key) === i,
  ) as TitlePart[];
}

/** Facts shown as: a look that was taken out becomes the plain facts. */
export function keptFactsAs(value: unknown): string {
  const look = typeof value === "string" && value ? value : "facts";
  return REMOVED_FACT_LOOKS.includes(look) ? "facts" : look;
}
