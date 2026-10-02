import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";
import { ResetSiteForm } from "./reset-form";



export default function ResetSiteSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="Wipe walks, members, messages, subscribers, and homepage edits, and put the starter content back. You stay the organiser."
      title="Reset the site"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <ResetSiteSettingsPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function ResetSiteSettingsPageContent() {
  await requirePermission("permCacheReset");

  return (
    <>
      <ResetSiteForm />
    </>
  );
}
