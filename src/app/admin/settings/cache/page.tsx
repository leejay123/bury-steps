import { RevealSuspense } from "@/components/reveal-suspense";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { SettingsPage } from "../settings-page";
import { SettingsMask } from "../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";

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
      <RevealSuspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <CacheSettingsPageContent />
        </PlaceholderPreview>
      </RevealSuspense>
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

/** While it loads: the real form, greyed (SettingsMask). */
function SettingsFallback() {
  return (
    <SettingsMask>
      <ClearCacheForm />
    </SettingsMask>
  );
}
