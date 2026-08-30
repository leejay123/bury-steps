import { requireAdmin } from "@/lib/auth";
import { getSiteNoticeCategories, getSiteNotices } from "@/lib/site-notices";
import { MAX_NOTICE_CATEGORIES, MAX_SITE_NOTICES } from "@/lib/notices";
import { PreviewMemberWelcomeDialog } from "@/components/member-welcome-dialog";
import { SiteNoticeManager } from "../notice-manager";
import { SettingsPage } from "../settings-page";

export const dynamic = "force-dynamic";

export default async function NoticesSettingsPage() {
  const admin = await requireAdmin();
  const [notices, categories] = await Promise.all([
    getSiteNotices(),
    getSiteNoticeCategories(),
  ]);

  return (
    <SettingsPage
      description={`Up to ${MAX_SITE_NOTICES} notices in the member bell, and up to ${MAX_NOTICE_CATEGORIES} categories for full-page notices. Signed-in members only.`}
      title="Notices"
    >
      <div className="mb-6 flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">One-time Walks welcome</p>
          <p className="text-sm text-muted-foreground">
            Members with no clock-ins yet see this popup once on Walks. Preview it here — it does
            not change whether a real member has already dismissed it.
          </p>
        </div>
        <PreviewMemberWelcomeDialog firstName={admin.firstName} />
      </div>
      <SiteNoticeManager
        categories={categories}
        maxCategories={MAX_NOTICE_CATEGORIES}
        maxNotices={MAX_SITE_NOTICES}
        notices={notices}
      />
    </SettingsPage>
  );
}
