import { RevealSuspense } from "@/components/reveal-suspense";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { defaultTheme, getSiteTheme, type SiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../settings-page";
import { SettingsMask } from "../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";
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
      <RevealSuspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <WalkEssentialsSettingsPageContent />
        </PlaceholderPreview>
      </RevealSuspense>
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

  return <SettingsView theme={theme} />;
}

/** The page drawn from the site's settings (also its placeholder, with the defaults). */
function SettingsView({ theme }: { theme: SiteTheme }) {
  return (
    <>
      <WalkEssentialsEditor items={theme.walkEssentials} />
    </>
  );
}

/** While it loads: the page drawn with the site's default settings, greyed (SettingsMask). */
function SettingsFallback() {
  return (
    <SettingsMask>
      <SettingsView theme={defaultTheme()} />
    </SettingsMask>
  );
}
