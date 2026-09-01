export const MAX_NOTICE_CATEGORIES = 8;
export const MAX_NOTICE_CATEGORY_LABEL = 32;
export const MAX_NOTICE_TITLE = 80;
/** Bell-only message and full-page teaser (list + drawer). Welcome stays longer. */
export const MAX_NOTICE_BELL_BODY = 160;
/** Welcome notice body only — longer than ordinary bell notices. */
export const MAX_NOTICE_TEASER = 500;
export const MAX_NOTICE_PAGE_BODY = 10_000;

/** Newest non-welcome notices shown in the member bell (welcome sits outside this count). */
export const BELL_NOTICE_LIMIT = 20;

/** Short teaser shown on the signed-in homepage Latest notices carousel. */
export const HOMEPAGE_NOTICE_CAROUSEL_BODY = 120;

/** Pinned welcome notice — seeded, edit title/body only, never delete; can disable. */
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
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function isPinnedNotice(notice: Pick<NoticeView, "systemKey">): boolean {
  return Boolean(notice.systemKey);
}

export function isWelcomeNotice(notice: Pick<NoticeView, "systemKey">): boolean {
  return notice.systemKey === WELCOME_NOTICE_SYSTEM_KEY;
}

/**
 * Unread badge in the bell. Fresh notices are “New”; edits clear read marks
 * so members see them again — label those “Updated” instead of pretending
 * they are brand new.
 */
export function noticeUnreadBadgeLabel(
  notice: Pick<NoticeView, "createdAt" | "updatedAt">,
): "New" | "Updated" {
  return notice.updatedAt.getTime() - notice.createdAt.getTime() >= 1000 ? "Updated" : "New";
}

/**
 * Body text for the member bell drawer. Welcome stays full length. Other
 * notices are capped at {@link MAX_NOTICE_BELL_BODY}; full-page rows always
 * end with an ellipsis so “Read full notice” is obvious.
 */
export function noticeBodyForBellDrawer(notice: NoticeView): string {
  if (isWelcomeNotice(notice)) return notice.body;

  const max = MAX_NOTICE_BELL_BODY;
  const overflow = notice.body.length > max;
  const text = overflow ? notice.body.slice(0, max).trimEnd() : notice.body;

  if (notice.kind === "PAGE" || overflow) {
    return text.endsWith("…") ? text : `${text}…`;
  }
  return text;
}

/**
 * Body text for the homepage Latest notices carousel. Every card uses the
 * same short teaser length so cards stay equal height; open the bell for more.
 */
export function noticeBodyForHomepageCarousel(notice: NoticeView): string {
  const text = notice.body.replace(/\s+/g, " ").trim();
  const max = HOMEPAGE_NOTICE_CAROUSEL_BODY;
  if (text.length <= max) return text;
  let cut = text.slice(0, max).trimEnd();
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > max * 0.6) cut = cut.slice(0, lastSpace);
  return `${cut}…`;
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

/** Newest first (admin lists, /notices). */
export function sortNoticesNewestFirst(notices: NoticeView[]): NoticeView[] {
  return [...notices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Welcome first, then newest — for organiser settings lists. */
export function sortNoticesForAdmin(notices: NoticeView[]): NoticeView[] {
  return [...notices].sort((a, b) => {
    const aPin = isWelcomeNotice(a) ? 0 : 1;
    const bPin = isWelcomeNotice(b) ? 0 : 1;
    if (aPin !== bPin) return aPin - bPin;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/**
 * Bell contents: enabled welcome first (if present), then the
 * {@link BELL_NOTICE_LIMIT} newest non-system notices. Older notices stay in
 * the DB and on /notices when they are full-page.
 */
export function noticesForBell(notices: NoticeView[]): NoticeView[] {
  const welcome = notices.find(
    (notice) => isWelcomeNotice(notice) && notice.enabled,
  );
  const rolling = sortNoticesNewestFirst(
    notices.filter((notice) => !notice.systemKey && notice.enabled),
  ).slice(0, BELL_NOTICE_LIMIT);
  return welcome ? [welcome, ...rolling] : rolling;
}

/** Homepage carousel: newest enabled notices only (no pinned welcome). */
export function noticesForHomepageCarousel(
  notices: NoticeView[],
  limit: number,
): NoticeView[] {
  return sortNoticesNewestFirst(
    notices.filter((notice) => !notice.systemKey && notice.enabled),
  ).slice(0, limit);
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
