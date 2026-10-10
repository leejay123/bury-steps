import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsContentSkeleton, SettingsPage, SettingsSection, SettingsSectionGroup } from "../settings-page";
import { HomepageSectionsSettings } from "./homepage-sections-settings";
import { CarouselToggle } from "./carousel-toggle";
import { TitleRevealToggle } from "./title-reveal-toggle";
import { MemberNoticesToggle } from "./member-notices-toggle";
import { HeroStyleSettings } from "./hero-style-settings";
import { SliderHeroWordsSettings } from "./slider-hero-words-settings";
import { SectionBgPatternSelect } from "./section-bg-pattern-select";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function HomepageLayoutSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="The site name and tagline always stay at the top. Choose the order of the sections below them, and whether the photos and latest notices show."
      previewHref="/"
      title="Homepage layout"
    >
      <Suspense fallback={<SettingsContentSkeleton />}>
        <HomepageLayoutSettingsPageContent />
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

  return (
    <>
      <HeroStyleSettings
        heroBgPattern={theme.heroBgPattern}
        heroOverlayOpacity={theme.heroOverlayOpacity}
        heroStyle={theme.heroStyle}
        heroTextColor={theme.heroTextColor}
        heroVideoKey={theme.heroVideoKey}
      />
      {theme.heroStyle === "slider" ? <SliderHeroWordsSettings words={theme.sliderHeroWords} /> : null}
      <HomepageSectionsSettings sectionOrder={theme.homepageSectionOrder} />
      <SettingsSectionGroup title="Show or hide">
        <CarouselToggle enabled={theme.carouselEnabled} />
        <TitleRevealToggle enabled={theme.titleRevealEnabled} />
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
