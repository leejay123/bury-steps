import { prisma } from "@/lib/db";
import type { NoticeView } from "@/lib/notices";

export async function getSiteNotices(): Promise<NoticeView[]> {
  try {
    return await prisma.siteNotice.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, body: true, createdAt: true },
    });
  } catch {
    return [];
  }
}

export async function getUnreadNoticeIds(userId: string): Promise<string[]> {
  try {
    const unread = await prisma.siteNotice.findMany({
      where: { reads: { none: { userId } } },
      select: { id: true },
    });
    return unread.map((notice) => notice.id);
  } catch {
    return [];
  }
}
