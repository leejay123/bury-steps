export const MAX_HOMEPAGE_FAQS = 20;

export const FAQ_CATEGORIES = [
  { id: "joining", label: "Joining" },
  { id: "walks", label: "Walks" },
  { id: "on-the-day", label: "On the day" },
  { id: "account", label: "Your account" },
] as const;

export type FaqCategoryId = (typeof FAQ_CATEGORIES)[number]["id"];

export type FaqView = {
  id: string;
  sortOrder: number;
  category: FaqCategoryId;
  question: string;
  answer: string;
};

export function isFaqCategory(value: string): value is FaqCategoryId {
  return FAQ_CATEGORIES.some((category) => category.id === value);
}

export function faqCategoryLabel(id: string): string {
  return FAQ_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

export const DEMO_FAQ = {
  category: "joining" as FaqCategoryId,
  question: "Do I need to be fit to join?",
  answer:
    "No. Walks are self-paced with no winners or losers. Beginners and people returning after a break are welcome. Come as you are and walk at a pace that suits you.",
};
