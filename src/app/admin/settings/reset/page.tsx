import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";
import { ResetSiteForm } from "./reset-form";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

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
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permCacheReset");

  return (
    <>
      <ResetSiteForm />
    </>
  );
}
