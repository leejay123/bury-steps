import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import {
  personalizeNotice,
  noticesForBell,
  sortNoticesForAdmin,
  sortNoticesNewestFirst,
  type NoticeAudience,
  type NoticeCategoryView,
  type NoticeView,
} from "@/lib/notices";
import { HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";

export const NOTICES_CACHE_TAG = "site-notices";

type CachedNotice = {
  id: string;
  title: string;
  body: string;
  kind: "BELL" | "PAGE";
  audience: NoticeAudience;
  slug: string | null;
  pageBody: string | null;
  categoryId: string | null;
  categoryLabel: string | null;
  systemKey: string | null;
  enabled: boolean;
  createdAt: string;
};

type CachedCategory = {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  noticeCount: number;
};

async function loadSiteNotices(): Promise<CachedNotice[]> {
  const rows = await prisma.siteNotice.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      body: true,
      kind: true,
      audience: true,
      slug: true,
      pageBody: true,
      categoryId: true,
      category: { select: { label: true } },
      systemKey: true,
      enabled: true,
      createdAt: true,
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    kind: row.kind,
    audience: row.audience,
    slug: row.slug,
    pageBody: row.pageBody,
    categoryId: row.categoryId,
    categoryLabel: row.category?.label ?? null,
    systemKey: row.systemKey,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
  }));
}

async function loadSiteNoticeCategories(): Promise<CachedCategory[]> {
  const rows = await prisma.siteNoticeCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      label: true,
      sortOrder: true,
      _count: { select: { notices: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    label: row.label,
    sortOrder: row.sortOrder,
    noticeCount: row._count.notices,
  }));
}

const getCachedSiteNotices = unstable_cache(loadSiteNotices, ["site-notices", "v8"], {
  tags: [NOTICES_CACHE_TAG],
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
});

const getCachedSiteNoticeCategories = unstable_cache(
  loadSiteNoticeCategories,
  ["site-notice-categories", "v1"],
  {
    tags: [NOTICES_CACHE_TAG],
    revalidate: HOMEPAGE_REVALIDATE_SECONDS,
  },
);

function reviveNotices(rows: CachedNotice[]): NoticeView[] {
  return sortNoticesNewestFirst(
    rows.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
    })),
  );
}

/** All notices for organiser settings (welcome first, then newest). */
export async function getSiteNotices(): Promise<NoticeView[]> {
  try {
    return sortNoticesForAdmin(reviveNotices(await getCachedSiteNotices()));
  } catch {
    return [];
  }
}

export async function getSiteNoticeCategories(): Promise<NoticeCategoryView[]> {
  try {
    return await getCachedSiteNoticeCategories();
  } catch {
    return [];
  }
}

/** Full-page notices for /notices (signed-in members only). Newest first. */
export async function getPageNotices(): Promise<NoticeView[]> {
  const notices = await getSiteNotices();
  return notices.filter(
    (notice) => notice.kind === "PAGE" && notice.slug && notice.enabled,
  );
}

/** Notices shown in the member bell (welcome + rolling window). */
export async function getSiteNoticeState(
  userId: string,
  firstName?: string | null,
): Promise<{
  notices: NoticeView[];
  unreadIds: string[];
}> {
  try {
    const [rows, reads] = await Promise.all([
      getCachedSiteNotices(),
      prisma.siteNoticeRead.findMany({
        where: { userId },
        select: { noticeId: true },
      }),
    ]);
    const notices = noticesForBell(reviveNotices(rows)).map((notice) =>
      personalizeNotice(notice, firstName),
    );
    const read = new Set(reads.map((row) => row.noticeId));
    return {
      notices,
      unreadIds: notices.filter((notice) => !read.has(notice.id)).map((notice) => notice.id),
    };
  } catch {
    return { notices: [], unreadIds: [] };
  }
}

export async function getPageNoticeBySlug(slug: string): Promise<NoticeView | null> {
  try {
    const row = await prisma.siteNotice.findFirst({
      where: { slug, kind: "PAGE", enabled: true },
      select: {
        id: true,
        title: true,
        body: true,
        kind: true,
        audience: true,
        slug: true,
        pageBody: true,
        categoryId: true,
        category: { select: { label: true } },
        systemKey: true,
        enabled: true,
        createdAt: true,
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      kind: row.kind,
      audience: row.audience,
      slug: row.slug,
      pageBody: row.pageBody,
      categoryId: row.categoryId,
      categoryLabel: row.category?.label ?? null,
      systemKey: row.systemKey,
      enabled: row.enabled,
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}

/** Idempotent; safe to call when opening a notice page or tapping a bell row. */
export async function recordSiteNoticeRead(userId: string, noticeId: string): Promise<void> {
  await prisma.siteNoticeRead.createMany({
    data: [{ noticeId, userId }],
    skipDuplicates: true,
  });
}
