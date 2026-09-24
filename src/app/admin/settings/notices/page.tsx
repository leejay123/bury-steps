import { requirePermission } from "@/lib/auth";
import { getSiteNoticeCategories, getSiteNotices } from "@/lib/site-notices";
import { MAX_NOTICE_CATEGORIES } from "@/lib/notices";
import { PreviewMemberWelcomeDialog } from "@/components/member-welcome-dialog";
import { SiteNoticeManager } from "../notice-manager";
import { SettingsPage, SettingsSection } from "../settings-page";

export const dynamic = "force-dynamic";

export default async function NoticesSettingsPage() {
  const admin = await requirePermission("permNotices");
  const [notices, categories] = await Promise.all([
    getSiteNotices(),
    getSiteNoticeCategories(),
  ]);

  return (
    <SettingsPage
      description={`Messages for signed-in members — short ones in the bell, longer ones as their own page on Notices, filed under up to ${MAX_NOTICE_CATEGORIES} categories.`}
      title="Notices"
    >
      <SiteNoticeManager
        categories={categories}
        maxCategories={MAX_NOTICE_CATEGORIES}
        notices={notices}
      />
      <SettingsSection
        description="New members who haven't clocked in yet see this popup once on the Walks page. Previewing it here doesn't affect whether a real member has already seen it."
        title="Welcome popup"
      >
        <div>
          <PreviewMemberWelcomeDialog firstName={admin.firstName} />
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
