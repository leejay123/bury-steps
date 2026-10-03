import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsContentSkeleton, SettingsPage } from "../settings-page";
import { WalkEssentialsEditor } from "./walk-essentials-editor";



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
  await requirePermission("permWalksEdit");
  const theme = await getSiteTheme();

  return (
    <>
      <WalkEssentialsEditor items={theme.walkEssentials} />
    </>
  );
}
