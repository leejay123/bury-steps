export const MAX_SITE_NOTICES = 10;
export const MAX_NOTICE_CATEGORIES = 8;
export const MAX_NOTICE_CATEGORY_LABEL = 32;
export const MAX_NOTICE_TITLE = 80;
export const MAX_NOTICE_TEASER = 500;
export const MAX_NOTICE_PAGE_BODY = 10_000;

export type NoticeKind = "BELL" | "PAGE";
/** Kept for existing rows. Notices are members-only; new writes always use MEMBERS. */
export type NoticeAudience = "MEMBERS" | "PUBLIC" | "VISITORS";

export type NoticeCategoryView = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  noticeCount: number;
};

export type NoticeView = {
  id: string;
  title: string;
  body: string;
  kind: NoticeKind;
  audience: NoticeAudience;
  slug: string | null;
  pageBody: string | null;
  categoryId: string | null;
  categoryLabel: string | null;
  createdAt: Date;
};

export function noticeCategorySlug(label: string): string {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "category";
}

export function noticePageSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return base || "notice";
}
