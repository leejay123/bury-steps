import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";
import { ClearCacheForm } from "./cache-form";



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
  await requirePermission("permCacheReset");

  return (
    <>
      <ClearCacheForm />
    </>
  );
}
