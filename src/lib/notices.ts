export const MAX_SITE_NOTICES = 10;
export const MAX_NOTICE_CATEGORIES = 8;
export const MAX_NOTICE_CATEGORY_LABEL = 32;
export const MAX_NOTICE_TITLE = 80;
export const MAX_NOTICE_TEASER = 500;
export const MAX_NOTICE_PAGE_BODY = 10_000;

/** Pinned welcome notice — seeded, edit title/body only, never delete. */
export const WELCOME_NOTICE_SYSTEM_KEY = "welcome";

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
  systemKey: string | null;
  createdAt: Date;
};

export function isPinnedNotice(notice: Pick<NoticeView, "systemKey">): boolean {
  return Boolean(notice.systemKey);
}

/** Replace {{firstName}} in notice copy for the viewing member. */
export function personalizeNoticeCopy(
  text: string,
  firstName: string | null | undefined,
): string {
  const name = firstName?.trim() || "there";
  return text.replaceAll("{{firstName}}", name);
}

export function personalizeNotice(
  notice: NoticeView,
  firstName: string | null | undefined,
): NoticeView {
  return {
    ...notice,
    title: personalizeNoticeCopy(notice.title, firstName),
    body: personalizeNoticeCopy(notice.body, firstName),
    pageBody: notice.pageBody
      ? personalizeNoticeCopy(notice.pageBody, firstName)
      : notice.pageBody,
  };
}

/** Welcome (pinned) first, then newest first. */
export function sortNoticesForBell(notices: NoticeView[]): NoticeView[] {
  return [...notices].sort((a, b) => {
    const aPin = a.systemKey === WELCOME_NOTICE_SYSTEM_KEY ? 0 : 1;
    const bPin = b.systemKey === WELCOME_NOTICE_SYSTEM_KEY ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

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
