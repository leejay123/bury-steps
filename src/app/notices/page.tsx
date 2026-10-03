import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getPageNotices, getSiteNoticeCategories } from "@/lib/site-notices";
import { NoticesBlogSection } from "@/components/notices-blog-section";
import { Skeleton } from "@/components/ui/skeleton";



export const metadata: Metadata = {
  title: "Notices",
  robots: { index: false, follow: false },
};

export default function NoticesPage() {
  return (
    // Notices are for members only, so they're added after the signed-in
    // check — never part of the ready-made page everyone shares.
    <Suspense fallback={<NoticesFallback />}>
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

/** The instant before the notices arrive: the page's real heading and
 * description (they never change) and list-shaped placeholders — the same
 * frame as the page, so nothing jumps. Same idea as the organiser pages. */
function NoticesFallback() {
  return (
    <div aria-busy="true" className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      <div className="flex flex-col gap-3 px-4 py-6 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Notices</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Updates from the organisers for signed-in members. Short messages stay in the bell; open a
          row here for the full write-up.
        </p>
        <Skeleton className="h-9 w-full max-w-md rounded-md" />
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6 md:px-6">
        <ul className="flex flex-col overflow-hidden rounded-xl border">
          {Array.from({ length: 5 }, (_, i) => (
            <li className="flex flex-col gap-2 border-b p-4 last:border-0" key={i}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3.5 w-3/4" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
