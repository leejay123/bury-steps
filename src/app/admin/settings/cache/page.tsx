import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";
import { ClearCacheForm } from "./cache-form";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function CacheSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="Use this if the public homepage still shows old photos, quotes or questions after you've saved changes."
      title="Refresh the homepage"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <CacheSettingsPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function CacheSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permCacheReset");

  return (
    <>
      <ClearCacheForm />
    </>
  );
}
