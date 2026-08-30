import type { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth";
import { getPageNotices, getSiteNoticeCategories } from "@/lib/site-notices";
import { NoticesBlogSection } from "@/components/notices-blog-section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notices — Bury Steps Walking Group",
  description: "Announcements from Bury Steps Walking Group.",
};

export default async function NoticesPage() {
  const user = await getOptionalUser();
  const [notices, categories] = await Promise.all([
    getPageNotices({ includeMembers: Boolean(user) }),
    getSiteNoticeCategories(),
  ]);

  return (
    <NoticesBlogSection
      categories={categories}
      notices={notices}
      signedIn={Boolean(user)}
    />
  );
}
