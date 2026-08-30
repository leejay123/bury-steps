import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getPageNotices, getSiteNoticeCategories } from "@/lib/site-notices";
import { NoticesBlogSection } from "@/components/notices-blog-section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notices — Bury Steps Walking Group",
  robots: { index: false, follow: false },
};

export default async function NoticesPage() {
  await requireUser();
  const [notices, categories] = await Promise.all([
    getPageNotices(),
    getSiteNoticeCategories(),
  ]);

  return (
    <div className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      <NoticesBlogSection categories={categories} notices={notices} />
    </div>
  );
}
