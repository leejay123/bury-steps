import { Suspense } from "react";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { getSiteNoticeCategories, getSiteNotices } from "@/lib/site-notices";
import { MAX_NOTICE_CATEGORIES } from "@/lib/notices";
import { PreviewMemberWelcomeDialog } from "@/components/member-welcome-dialog";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { Button } from "@/components/ui/button";
import { AdminPageIntro } from "../admin-page-intro";
import { SiteNoticeManager } from "../settings/notice-manager";
import { SettingsSection } from "../settings/settings-page";

/**
 * Notices for the people who run them (owners, and anyone given the Notices
 * permission) — the organiser side of Notices, as Walks has /admin/walks.
 * Members read them at /notices; the menu sends whoever manages notices
 * here (navItems). proxy.ts and the page's own check keep everyone else out.
 * Fetched ahead from the menu, so it opens with the notices there.
 */
export const prefetch = "partial";

const INTRO = `Messages for signed-in members — short ones in the bell, longer ones as their own page on Notices, filed under up to ${MAX_NOTICE_CATEGORIES} categories.`;

export default function AdminNoticesPage() {
  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-6">
      <AdminPageIntro
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/notices">See it as members do</Link>
          </Button>
        }
        description={INTRO}
        title="Notices"
      />
      <Suspense fallback={<NoticesFallback />}>
        <PlaceholderPreview fallback={<NoticesFallback />}>
          <AdminNoticesContent />
        </PlaceholderPreview>
      </Suspense>
    </div>
  );
}

async function AdminNoticesContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with the notices already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  const admin = await requirePermission("permNotices");
  const [notices, categories] = await Promise.all([getSiteNotices(), getSiteNoticeCategories()]);
  return <NoticesView categories={categories} firstName={admin.firstName} notices={notices} />;
}

function NoticesView({
  categories,
  firstName,
  notices,
}: {
  categories: Awaited<ReturnType<typeof getSiteNoticeCategories>>;
  firstName?: string | null;
  notices: Awaited<ReturnType<typeof getSiteNotices>>;
}) {
  return (
    <>
      <SiteNoticeManager categories={categories} maxCategories={MAX_NOTICE_CATEGORIES} notices={notices} />
      <SettingsSection
        description="New members who haven't clocked in yet see this popup once on the Walks page. Previewing it here doesn't affect whether a real member has already seen it."
        title="Welcome popup"
      >
        <div>
          <PreviewMemberWelcomeDialog firstName={firstName} />
        </div>
      </SettingsSection>
    </>
  );
}

/**
 * While the page checks who you are: the real notices, from the same shared
 * saved copies members' pages use (only people who manage notices reach this
 * page), so a refresh shows them at once instead of an empty space.
 */
async function NoticesFallback() {
  const [notices, categories] = await Promise.all([getSiteNotices(), getSiteNoticeCategories()]);
  return <NoticesView categories={categories} notices={notices} />;
}
