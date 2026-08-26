import { requireAdmin } from "@/lib/auth";
import { getSiteNotices } from "@/lib/site-notices";
import { MAX_SITE_NOTICES } from "@/lib/notices";
import { SiteNoticeManager } from "../notice-manager";
import { SettingsPage } from "../settings-page";

export const dynamic = "force-dynamic";

export default async function NoticesSettingsPage() {
  await requireAdmin();
  const notices = await getSiteNotices();

  return (
    <SettingsPage
      description={`Up to ${MAX_SITE_NOTICES} messages in the bell at the top of the site. Signed-in members see them. You can add, edit, or remove them.`}
      title="Notices"
    >
      <SiteNoticeManager maxNotices={MAX_SITE_NOTICES} notices={notices} />
    </SettingsPage>
  );
}
