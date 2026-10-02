import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getPageNotices, getSiteNoticeCategories } from "@/lib/site-notices";
import { NoticesBlogSection } from "@/components/notices-blog-section";



export const metadata: Metadata = {
  title: "Notices",
  robots: { index: false, follow: false },
};

export default function NoticesPage() {
  return (
    <>
      {/* Signed-in check streams in beside the page (it only ever redirects). */}
      <Suspense fallback={null}>
        <RequireMember />
      </Suspense>
      <NoticesContent />
    </>
  );
}

async function RequireMember() {
  await requireUser();
  return null;
}

async function NoticesContent() {
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
