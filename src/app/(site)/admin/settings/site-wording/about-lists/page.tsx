import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { defaultTheme, getSiteTheme, type SiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { SettingsMask } from "../../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { AboutListsSettings } from "../about-lists-settings";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function AboutListsWordingPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The goals, places, expect, and rules lists shown in the homepage's About drawer."
      previewHref="/"
      title="About lists"
    >
      <Suspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <AboutListsWordingPageContent />
        </PlaceholderPreview>
      </Suspense>
    </SettingsPage>
  );
}

async function AboutListsWordingPageContent() {
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
      <AboutListsSettings
        aboutExpectHeading={theme.aboutExpectHeading}
        aboutExpectText={theme.aboutExpectText}
        aboutGoalsHeading={theme.aboutGoalsHeading}
        aboutGoalsText={theme.aboutGoalsText}
        aboutPlacesHeading={theme.aboutPlacesHeading}
        aboutPlacesText={theme.aboutPlacesText}
        aboutRulesHeading={theme.aboutRulesHeading}
        aboutRulesText={theme.aboutRulesText}
      />
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
