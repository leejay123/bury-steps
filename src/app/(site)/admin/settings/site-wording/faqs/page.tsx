import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { defaultTheme, getSiteTheme, type SiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { SettingsMask } from "../../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { FaqSectionCopySettings } from "../faq-section-copy-settings";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function FaqWordingPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The heading and short intro above the question list on the homepage. The questions themselves are managed under FAQs."
      previewHref="/"
      title="FAQ heading"
    >
      <Suspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <FaqWordingPageContent />
        </PlaceholderPreview>
      </Suspense>
    </SettingsPage>
  );
}

async function FaqWordingPageContent() {
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
      <FaqSectionCopySettings
        faqSectionIntro={theme.faqSectionIntro}
        faqSectionTitle={theme.faqSectionTitle}
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
