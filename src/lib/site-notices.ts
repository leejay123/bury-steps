import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import type { NoticeView } from "@/lib/notices";
import { HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";

export const NOTICES_CACHE_TAG = "site-notices";

async function loadSiteNotices(): Promise<NoticeView[]> {
  return prisma.siteNotice.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true, createdAt: true },
  });
}

const getCachedSiteNotices = unstable_cache(loadSiteNotices, ["site-notices", "v1"], {
  tags: [NOTICES_CACHE_TAG],
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
});

export async function getSiteNotices(): Promise<NoticeView[]> {
  try {
    return await getCachedSiteNotices();
  } catch {
    return [];
  }
}

export async function getSiteNoticeState(userId: string): Promise<{
  notices: NoticeView[];
  unreadIds: string[];
}> {
  try {
    const [notices, reads] = await Promise.all([
      getCachedSiteNotices(),
      prisma.siteNoticeRead.findMany({
        where: { userId },
        select: { noticeId: true },
      }),
    ]);
    const read = new Set(reads.map((row) => row.noticeId));
    return {
      notices,
      unreadIds: notices.filter((notice) => !read.has(notice.id)).map((notice) => notice.id),
    };
  } catch {
    return { notices: [], unreadIds: [] };
  }
}
