import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { NoticeView } from "@/lib/notices";
import { HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";

export const NOTICES_CACHE_TAG = "site-notices";

type CachedNotice = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

async function loadSiteNotices(): Promise<CachedNotice[]> {
  const rows = await prisma.siteNotice.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true, createdAt: true },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }));
}

const getCachedSiteNotices = unstable_cache(loadSiteNotices, ["site-notices", "v2"], {
  tags: [NOTICES_CACHE_TAG],
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
});

function reviveNotices(rows: CachedNotice[]): NoticeView[] {
  return rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
  }));
}

export async function getSiteNotices(): Promise<NoticeView[]> {
  try {
    return reviveNotices(await getCachedSiteNotices());
  } catch {
    return [];
  }
}

export async function getSiteNoticeState(userId: string): Promise<{
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
    const notices = reviveNotices(rows);
    const read = new Set(reads.map((row) => row.noticeId));
    return {
      notices,
      unreadIds: notices.filter((notice) => !read.has(notice.id)).map((notice) => notice.id),
    };
  } catch {
    return { notices: [], unreadIds: [] };
  }
}
