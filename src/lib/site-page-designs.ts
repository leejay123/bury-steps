/** Saving a public page design refreshes this tag — the live pages that read it. */
export const SITE_PAGE_DESIGNS_TAG = "site-page-designs";

export const SITE_PAGE_KEYS = ["home", "about", "contact", "privacy", "terms", "apps"] as const;
export type SitePageKey = (typeof SITE_PAGE_KEYS)[number];

export const SITE_PAGES: {
  key: SitePageKey;
  title: string;
  path: string;
  description: string;
}[] = [
  { key: "home", title: "Home", path: "/", description: "The public homepage." },
  { key: "about", title: "About", path: "/about", description: "How the group started, and what to expect." },
  { key: "contact", title: "Contact", path: "/contact", description: "The contact page and message form." },
  { key: "privacy", title: "Privacy", path: "/privacy-policy", description: "The privacy policy." },
  { key: "terms", title: "Terms", path: "/terms-of-service", description: "The terms of service." },
  { key: "apps", title: "Apps", path: "/apps", description: "The walking apps page." },
];

export function isSitePageKey(value: string): value is SitePageKey {
  return (SITE_PAGE_KEYS as readonly string[]).includes(value);
}

export type PuckBlock = { type: string; props: Record<string, unknown> };

/** Puck page data: a list of blocks in order. */
export type PuckData = {
  root?: { props?: Record<string, unknown> };
  content: PuckBlock[];
  zones?: Record<string, unknown>;
};

export type SitePageSlot = { draft: unknown | null; published: unknown | null };
export type SitePageDesigns = Record<SitePageKey, SitePageSlot>;

export function emptySitePageDesigns(): SitePageDesigns {
  return {
    home: { draft: null, published: null },
    about: { draft: null, published: null },
    contact: { draft: null, published: null },
    privacy: { draft: null, published: null },
    terms: { draft: null, published: null },
    apps: { draft: null, published: null },
  };
}

export function isPuckData(value: unknown): value is PuckData {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as PuckData).content)
  );
}

function asSlot(value: unknown): SitePageSlot {
  if (isPuckData(value)) return { draft: value, published: value };
  if (typeof value !== "object" || value === null) return { draft: null, published: null };
  const row = value as { draft?: unknown; published?: unknown };
  return {
    draft: row.draft ?? null,
    published: row.published ?? null,
  };
}

export function parseSitePageDesigns(raw: string | null | undefined): SitePageDesigns {
  const empty = emptySitePageDesigns();
  const text = raw?.trim() ?? "";
  if (!text) return empty;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return empty;
    const record = parsed as Record<string, unknown>;
    for (const key of SITE_PAGE_KEYS) {
      if (key in record) empty[key] = asSlot(record[key]);
    }
    return empty;
  } catch {
    return empty;
  }
}

export function puckPage(content: PuckBlock[]): PuckData {
  return { root: { props: {} }, content };
}

export function puckBlock(type: string, index: number, props: Record<string, unknown> = {}): PuckBlock {
  return { type, props: { id: `${type}-${index}`, ...props } };
}

function hasBlock(data: PuckData, type: string): boolean {
  return data.content.some((block) => block.type === type);
}

/** Homepage hero always stays — prepend the seed hero if it was removed. */
export function ensureHomeHero(data: PuckData, hero: PuckBlock): PuckData {
  if (hasBlock(data, "HomeHero")) return data;
  return { ...data, content: [hero, ...data.content] };
}

/** The contact form always stays on the published contact page. */
export function ensureContactForm(data: PuckData, form: PuckBlock): PuckData {
  if (hasBlock(data, "ContactForm")) return data;
  return { ...data, content: [...data.content, form] };
}

export function editorDesign(slot: SitePageSlot, seed: PuckData): PuckData {
  if (isPuckData(slot.draft)) return slot.draft;
  if (isPuckData(slot.published)) return slot.published;
  return seed;
}

export function publishedDesign(slot: SitePageSlot): PuckData | null {
  return isPuckData(slot.published) ? slot.published : null;
}

export function pageHasPublished(slot: SitePageSlot): boolean {
  return isPuckData(slot.published);
}

export function pageHasDraft(slot: SitePageSlot): boolean {
  return isPuckData(slot.draft);
}

/** A saved draft that isn't what's on the live page (so Discard draft has something to throw away). */
export function pageHasUnpublishedDraft(slot: SitePageSlot): boolean {
  if (!isPuckData(slot.draft)) return false;
  if (!isPuckData(slot.published)) return true;
  return JSON.stringify(slot.draft) !== JSON.stringify(slot.published);
}

export function publicPathFor(page: SitePageKey): string {
  return SITE_PAGES.find((item) => item.key === page)?.path ?? "/";
}
