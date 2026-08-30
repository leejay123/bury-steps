import { requireAdmin } from "@/lib/auth";
import { getSiteNoticeCategories, getSiteNotices } from "@/lib/site-notices";
import { MAX_NOTICE_CATEGORIES, MAX_SITE_NOTICES } from "@/lib/notices";
import { SiteNoticeManager } from "../notice-manager";
import { SettingsPage } from "../settings-page";

export const dynamic = "force-dynamic";

export default async function NoticesSettingsPage() {
  await requireAdmin();
  const [notices, categories] = await Promise.all([
    getSiteNotices(),
    getSiteNoticeCategories(),
  ]);

  return (
    <SettingsPage
      description={`Up to ${MAX_SITE_NOTICES} notices in the bell, and up to ${MAX_NOTICE_CATEGORIES} categories for full-page notices. Full-page notices can be public or members only.`}
      title="Notices"
    >
      <SiteNoticeManager
        categories={categories}
        maxCategories={MAX_NOTICE_CATEGORIES}
        maxNotices={MAX_SITE_NOTICES}
        notices={notices}
      />
    </SettingsPage>
  );
}
