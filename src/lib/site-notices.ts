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

export async function getUnreadNoticeCount(userId: string): Promise<number> {
  try {
    return await prisma.siteNotice.count({
      where: { reads: { none: { userId } } },
    });
  } catch {
    return 0;
  }
}
