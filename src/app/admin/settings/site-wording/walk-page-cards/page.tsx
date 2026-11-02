import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { defaultTheme, getSiteTheme, type SiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { SettingsMask } from "../../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { WalkPageCopySettings } from "../walk-page-copy-settings";
import { WalkWordingSettings } from "../walk-wording-settings";

/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function WalkPageCardsWordingPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="Wording used on walk pages. Layout and which blocks show are set in the walk page designer (Design this page on any organiser walk)."
      title="Walk page cards"
    >
      <Suspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <WalkPageCardsWordingPageContent />
        </PlaceholderPreview>
      </Suspense>
    </SettingsPage>
  );
}

async function WalkPageCardsWordingPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return <SettingsView theme={theme} />;
}

/** The page drawn from the site's settings (also its placeholder, with the defaults). */
function SettingsView({ theme }: { theme: SiteTheme }) {
  return (
    <>
      <WalkPageCopySettings
        beforeYouSetOffTipsText={theme.beforeYouSetOffTipsText}
        howWalksWorkStepsText={theme.howWalksWorkStepsText}
      />
      <WalkWordingSettings wording={theme.walkWording} />
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
