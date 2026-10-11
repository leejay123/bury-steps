import { RevealSuspense } from "@/components/reveal-suspense";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { defaultTheme, getSiteTheme, type SiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../../settings-page";
import { SettingsMask } from "../../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { TestimonialsSectionCopySettings } from "../testimonials-section-copy-settings";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function TestimonialsWordingPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The heading and short intro above the quote grid on the homepage. The quotes themselves are managed under Testimonials."
      previewHref="/"
      title="Testimonials heading"
    >
      <RevealSuspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <TestimonialsWordingPageContent />
        </PlaceholderPreview>
      </RevealSuspense>
    </SettingsPage>
  );
}

async function TestimonialsWordingPageContent() {
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
      <TestimonialsSectionCopySettings
        testimonialsSectionEyebrow={theme.testimonialsSectionEyebrow}
        testimonialsSectionIntro={theme.testimonialsSectionIntro}
        testimonialsSectionTitle={theme.testimonialsSectionTitle}
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
