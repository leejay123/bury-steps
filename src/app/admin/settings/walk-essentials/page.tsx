import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";
import { WalkEssentialsEditor } from "./walk-essentials-editor";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function WalkEssentialsSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The tick-box list under Essentials when you create or edit a walk. Rename items, pick their icons, add your own or remove ones you don't use. Changes show on every walk straight away."
      title="Walk essentials"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <WalkEssentialsSettingsPageContent />
      </Suspense>
    </SettingsPage>
  );
}

async function WalkEssentialsSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permWalksEdit");
  const theme = await getSiteTheme();

  return (
    <>
      <WalkEssentialsEditor items={theme.walkEssentials} />
    </>
  );
}
