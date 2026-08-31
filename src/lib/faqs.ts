export const MAX_HOMEPAGE_FAQS = 20;
export const MAX_FAQ_CATEGORIES = 8;
export const MAX_FAQ_CATEGORY_LABEL = 32;
export const MAX_FAQ_SECTION_TITLE = 80;
export const MAX_FAQ_SECTION_INTRO = 280;

export const DEFAULT_FAQ_SECTION_TITLE = "Frequently asked questions";
export const DEFAULT_FAQ_SECTION_INTRO =
  "How to join, what to bring, and how clock-in works. If you still have a question, ask in the Facebook group.";

export function parseFaqSectionTitle(raw: string): string | "invalid" {
  const title = raw.trim().replace(/\s+/g, " ");
  if (title.length < 2 || title.length > MAX_FAQ_SECTION_TITLE) return "invalid";
  return title;
}

export function parseFaqSectionIntro(raw: string): string | "invalid" {
  const intro = raw.trim().replace(/\s+/g, " ");
  if (intro.length < 8 || intro.length > MAX_FAQ_SECTION_INTRO) return "invalid";
  return intro;
}

export const DEFAULT_FAQ_CATEGORIES = [
  { id: "faqcat_joining", slug: "joining", label: "Joining", sortOrder: 0 },
  { id: "faqcat_walks", slug: "walks", label: "Walks", sortOrder: 1 },
  { id: "faqcat_on_the_day", slug: "on-the-day", label: "On the day", sortOrder: 2 },
  { id: "faqcat_account", slug: "account", label: "Your account", sortOrder: 3 },
] as const;

export type FaqCategoryView = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  faqCount: number;
};

export type FaqView = {
  id: string;
  sortOrder: number;
  categoryId: string;
  categoryLabel: string;
  question: string;
  answer: string;
};

export function faqCategorySlug(label: string): string {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "category";
}

export const DEMO_FAQ = {
  categorySlug: "joining",
  question: "Do I need to be fit to join?",
  answer:
    "No. Walks are self-paced with no winners or losers. Beginners and people returning after a break are welcome. Come as you are and walk at a pace that suits you.",
};
