import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getOptionalUser, requireUser } from "@/lib/auth";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { NOTICES_CACHE_TAG, getPageNotices, getSiteNoticeCategories, getSiteNoticeState } from "@/lib/site-notices";
import { NoticesBlogSection } from "@/components/notices-blog-section";
import { NoticesSearchChrome } from "@/components/list-chrome";
import { NoticeCategoryBar } from "@/components/notice-category-bar";
import { RememberListCount, RememberText } from "@/components/remember-list-count";
import { RememberedAction } from "@/components/remembered-action";
import { CreateNoticeDrawer } from "@/components/create-notice-drawer";
import { CAN_CREATE_NOTICE_COOKIE } from "@/lib/remembered-rows-key";
import { FULL_ORGANISER_PERMISSIONS, ORGANISER_PERMISSIONS } from "@/lib/organiser-permissions";
import type { NoticeCategoryView } from "@/lib/notices";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { NoticeRowsSkeleton } from "@/components/list-skeletons";



/**
 * Trial of fetching a page ahead (Partial Prefetching) for this page only:
 * a menu link to Notices loads the page's ready-made copy, with the
 * member's notices in it (getMemberNotices), before it's clicked, so the
 * list is there straight away instead of its placeholder. See
 * node_modules/next/dist/docs/01-app/02-guides/optimizing-prefetching.md.
 */
export const prefetch = "partial";

export const metadata: Metadata = {
  title: "Notices",
  robots: { index: false, follow: false },
};

export default async function NoticesPage() {
  // The notices are the same for every member, from shared saved copies,
  // and only signed-in people ever get this page (the sign-in check in
  // proxy.ts runs first). So the ready-made page already has the real list
  // — on a refresh too — and only the member's own "New" labels follow.
  const [notices, categories] = await Promise.all([getPageNotices(), getSiteNoticeCategories()]);
  const used = categories.filter((category) => notices.some((notice) => notice.categoryId === category.id));
  const tabs = used.length > 0 ? [{ id: "all", label: "All" }, ...used.map(({ id, label }) => ({ id, label }))] : null;
  const rows = Math.min(notices.length, LIST_PAGE_SIZE);
  const sharedList = (
    <div className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      <NoticesBlogSection
        action={<CreateNoticeAction categories={categories} />}
        categories={categories}
        notices={notices}
      />
    </div>
  );
  return (
    <Suspense fallback={sharedList}>
      {/* The owner's placeholder preview still shows the list's placeholder. */}
      <PlaceholderPreview fallback={<NoticesFallback categories={tabs} rows={rows} />}>
        <NoticesForMember />
      </PlaceholderPreview>
    </Suspense>
  );
}

/** "Create a notice", for people allowed to (`known` once the page knows who
 * this is; before that, as last time in this browser — RememberedAction). */
function CreateNoticeAction({ categories, known }: { categories: NoticeCategoryView[]; known?: boolean }) {
  return (
    <RememberedAction className="shrink-0" known={known} name={CAN_CREATE_NOTICE_COOKIE}>
      <CreateNoticeDrawer categories={categories} />
    </RememberedAction>
  );
}

/**
 * The member's notices, as a private saved copy: kept in this browser only
 * ("use cache: private" never stores on the server), so it can travel with
 * the page fetched ahead. The notices themselves come from the shared saved
 * copy (site-notices.ts); only "who is this" and "which are new" are
 * personal. Five minutes, the shortest that a fetched-ahead page reuses;
 * a notice read in this tab still loses its New at once (notice-events.ts),
 * and a saved or edited notice clears it (NOTICES_CACHE_TAG).
 */
async function getMemberNotices() {
  "use cache: private";
  cacheTag(NOTICES_CACHE_TAG);
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  const user = await getOptionalUser();
  if (!user) return null;
  const [notices, categories, { unreadIds }] = await Promise.all([
    getPageNotices(),
    getSiteNoticeCategories(),
    // Same unread list as the bell, so the rows the Notices dot is about
    // say "New" or "Updated".
    getSiteNoticeState(user.id, user.firstName),
  ]);
  // Same rule as the save itself (requireAdmin + permNotices).
  const canCreate =
    user.role === "ADMIN" &&
    (user.isOwner ? FULL_ORGANISER_PERMISSIONS : ORGANISER_PERMISSIONS).permNotices;
  return { notices, categories, unreadIds, canCreate };
}

async function NoticesForMember() {
  const member = await getMemberNotices();
  // Not signed in: requireUser sends them to sign in, as before.
  if (!member) await requireUser();
  const { notices, categories, unreadIds, canCreate } = member ?? {
    notices: [],
    categories: [],
    unreadIds: [],
    canCreate: false,
  };

  return (
    <div className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      <RememberListCount count={Math.min(notices.length, LIST_PAGE_SIZE)} id="notices" />
      <RememberText name={CAN_CREATE_NOTICE_COOKIE} value={canCreate ? "1" : ""} />
      <NoticesBlogSection
        action={<CreateNoticeAction categories={categories} known={canCreate} />}
        categories={categories}
        notices={notices}
        unreadIds={unreadIds}
      />
    </div>
  );
}

/** The instant before the notices arrive: the page's real heading and
 * description (they never change) and list-shaped placeholders — the same
 * frame as the page, so nothing jumps. Same idea as the organiser pages. */
function NoticesFallback({
  categories,
  rows,
}: {
  categories: { id: string; label: string }[] | null;
  rows: number;
}) {
  return (
    <div data-page-loading="" aria-busy="true" className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      <section className="flex flex-col gap-0">
        <div className="flex flex-col gap-3 px-4 py-6 md:px-6">
          <h1 className="text-lg font-semibold tracking-tight">Notices</h1>
          <p className="text-sm text-muted-foreground">
            Updates from the organisers for signed-in members. Short messages stay in the bell; open a
            row here for the full write-up.
          </p>
          <NoticesSearchChrome />
        </div>
        {categories ? <NoticeCategoryBar labels={categories} /> : null}
        <div className="flex flex-col gap-4 px-4 py-6 md:px-6">
          {/* Exactly as many rows as there are notices, from the first paint. */}
          <NoticeRowsSkeleton known={rows} remember="notices" />
        </div>
      </section>
    </div>
  );
}
