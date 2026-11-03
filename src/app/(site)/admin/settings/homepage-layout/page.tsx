import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { defaultTheme, getSiteTheme, type SiteTheme } from "@/lib/site-theme";
import { SettingsPage, SettingsSection, SettingsSectionGroup } from "../settings-page";
import { SettingsMask } from "../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { CarouselToggle } from "./carousel-toggle";
import { MemberNoticesToggle } from "./member-notices-toggle";
import { SectionBgPatternSelect } from "./section-bg-pattern-select";

/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function HomepageLayoutSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="Show or hide homepage sections, and optional background patterns behind them."
      previewHref="/"
      title="Homepage layout"
    >
      <Suspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <HomepageLayoutSettingsPageContent />
        </PlaceholderPreview>
      </Suspense>
    </SettingsPage>
  );
}

async function HomepageLayoutSettingsPageContent() {
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
      <SettingsSectionGroup title="Show or hide">
        <CarouselToggle enabled={theme.carouselEnabled} />
        <MemberNoticesToggle enabled={theme.memberNoticesEnabled} />
      </SettingsSectionGroup>
      <SettingsSection
        description="An optional decorative pattern behind each section's content — None leaves it exactly as it looks today."
        title="Background patterns"
      >
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <SectionBgPatternSelect
            label="How this started"
            pattern={theme.howThisStartedBgPattern}
            section="howThisStarted"
          />
          <SectionBgPatternSelect label="Testimonials" pattern={theme.testimonialsBgPattern} section="testimonials" />
          <SectionBgPatternSelect
            label="Latest notices"
            pattern={theme.memberNoticesBgPattern}
            section="memberNotices"
          />
          <SectionBgPatternSelect label="FAQs" pattern={theme.faqsBgPattern} section="faqs" />
        </div>
      </SettingsSection>
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
