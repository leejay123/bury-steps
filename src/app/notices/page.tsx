import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getPageNotices, getSiteNoticeCategories } from "@/lib/site-notices";
import { NoticesBlogSection } from "@/components/notices-blog-section";
import { PageFallback } from "@/components/page-fallback";



export const metadata: Metadata = {
  title: "Notices",
  robots: { index: false, follow: false },
};

export default function NoticesPage() {
  return (
    // Notices are for members only, so they're added after the signed-in
    // check — never part of the ready-made page everyone shares.
    <Suspense fallback={<PageFallback />}>
      <NoticesForMember />
    </Suspense>
  );
}

async function NoticesForMember() {
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
