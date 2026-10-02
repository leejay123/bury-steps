import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage, SettingsSection, SettingsSectionGroup } from "../settings-page";
import { HomepageSectionsSettings } from "./homepage-sections-settings";
import { CarouselToggle } from "./carousel-toggle";
import { TitleRevealToggle } from "./title-reveal-toggle";
import { MemberNoticesToggle } from "./member-notices-toggle";
import { HeroStyleSettings } from "./hero-style-settings";
import { SliderHeroWordsSettings } from "./slider-hero-words-settings";
import { SectionBgPatternSelect } from "./section-bg-pattern-select";


// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


export default async function HomepageLayoutSettingsPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="The site name and tagline always stay at the top. Choose the order of the sections below them, and whether the photos and latest notices show."
      previewHref="/"
      title="Homepage layout"
    >
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
    </SettingsPage>
  );
}
