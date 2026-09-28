/**
 * Owner-chosen text sizes (Settings → Branding → Text sizes). Values are
 * desktop pixel sizes; phones get scaled versions via the text-headline /
 * text-section-heading / text-intro utilities in globals.css.
 */
export const TEXT_SIZE_FIELDS = [
  {
    key: "headline",
    label: "Headline",
    hint: "The big title at the top of the homepage. Shrinks to about 60% on phones.",
    options: [40, 48, 56, 60],
  },
  {
    key: "section",
    label: "Section headings",
    hint: "Titles like How this started and Frequently asked questions. Shrinks to about 70% on phones.",
    options: [28, 32, 36, 40],
  },
  {
    key: "intro",
    label: "Intro lines",
    hint: "The line under each homepage heading, a notice's lead-in, the video tagline, and the FAQ and notice tabs. 1px smaller on phones, never under 14px.",
    options: [14, 15, 16, 18],
  },
  {
    key: "body",
    label: "Body text",
    hint: "Everyday text across the site — lists, cards, forms, and descriptions. The same on phones.",
    options: [14, 15, 16],
  },
] as const;

export type TextSizeKey = (typeof TEXT_SIZE_FIELDS)[number]["key"];
export type TextSizes = Record<TextSizeKey, number>;

/** Matches the sizes the site used before these settings existed. */
export const DEFAULT_TEXT_SIZES: TextSizes = { headline: 60, section: 36, intro: 16, body: 14 };

export function parseTextSize(key: TextSizeKey, value: unknown): number | null {
  const n = Number(value);
  const field = TEXT_SIZE_FIELDS.find((f) => f.key === key);
  return field && (field.options as readonly number[]).includes(n) ? n : null;
}

/** Unitless custom properties read by the text-size utilities in globals.css. */
export function textSizeCssVars(sizes: TextSizes): Record<string, string> {
  return {
    "--text-headline-n": String(sizes.headline),
    "--text-section-n": String(sizes.section),
    "--text-intro-n": String(sizes.intro),
    "--text-body-n": String(sizes.body),
  };
}
