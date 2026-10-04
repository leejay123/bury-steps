import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getPageNotices, getSiteNoticeCategories } from "@/lib/site-notices";
import { NoticesBlogSection } from "@/components/notices-blog-section";
import { NoticesSearchChrome } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { rememberedRows } from "@/lib/remembered-rows";
import { NoticeRowsSkeleton } from "@/components/list-skeletons";



export const metadata: Metadata = {
  title: "Notices",
  robots: { index: false, follow: false },
};

export default function NoticesPage() {
  return (
    // Notices are for members only, so they're added after the signed-in
    // check — never part of the ready-made page everyone shares.
    <Suspense fallback={<NoticesFallback rows={0} />}>
      <NoticesCounted />
    </Suspense>
  );
}

async function NoticesCounted() {
  const rows = await rememberedRows("notices");
  return (
    <Suspense fallback={<NoticesFallback rows={rows} />}>
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
      <RememberListCount count={Math.min(notices.length, LIST_PAGE_SIZE)} id="notices" />
      <NoticesBlogSection categories={categories} notices={notices} />
    </div>
  );
}

/** The instant before the notices arrive: the page's real heading and
 * description (they never change) and list-shaped placeholders — the same
 * frame as the page, so nothing jumps. Same idea as the organiser pages. */
function NoticesFallback({ rows }: { rows: number }) {
  return (
    <div aria-busy="true" className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      <div className="flex flex-col gap-3 px-4 py-6 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Notices</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Updates from the organisers for signed-in members. Short messages stay in the bell; open a
          row here for the full write-up.
        </p>
        <NoticesSearchChrome />
      </div>
      <div className="px-4 py-6 md:px-6">
        <NoticeRowsSkeleton rows={rows} />
      </div>
    </div>
  );
}
