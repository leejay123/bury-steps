import { Suspense } from "react";
import { HeroSection } from "@/components/hero";
import { HeroCinematic } from "@/components/hero-cinematic";
import { HeroGlobe } from "@/components/hero-globe";
import { HeroMarqueeHome } from "@/components/hero-marquee-home";
import { HeroParallaxHome } from "@/components/hero-parallax-home";
import { HeroSliderHome } from "@/components/hero-slider-home";
import {
  HeroAccordionHome,
  HeroDiagonalHome,
  HeroStripHome,
  HeroTilesHome,
} from "@/components/hero-photo-styles";
import { HomeWelcome } from "@/components/home-welcome";
import { getOptionalUser } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { getHomepageMemberNotices } from "@/lib/site-notices";
import { getProgressEnabled } from "@/lib/progress-settings";
import { getHomepageGlobeData } from "@/lib/homepage-globe";
import { heroVideoPoster, heroVideoSrc, type HeroStyle } from "@/lib/hero-style";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";



/** The photo heroes picked from the Parallax design options. */
const PHOTO_HEROES: Partial<Record<HeroStyle, typeof HeroStripHome>> = {
  strip: HeroStripHome,
  tiles: HeroTilesHome,
  diagonal: HeroDiagonalHome,
  accordion: HeroAccordionHome,
};

export default async function Home() {
  // Only what the hero needs is awaited here, so the hero — in whichever
  // style is chosen — is part of the first paint, never a guessed skeleton.
  // The sections below stream in behind their own Suspense boundary.
  const [user, theme, slides] = await Promise.all([getOptionalUser(), getSiteTheme(), getHomepageSlides()]);
  const globe = theme.heroStyle === "globe" ? await getHomepageGlobeData() : null;

  return (
    <div className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      {theme.heroStyle === "cinematic" ? (
        <HeroCinematic
          isSignedIn={user !== null}
          overlayOpacity={theme.heroOverlayOpacity}
          siteName={theme.siteName}
          siteTagline={theme.siteTagline}
          textColor={theme.heroTextColor}
          videoPoster={heroVideoPoster(theme.heroVideoKey)}
          videoSrc={heroVideoSrc(theme.heroVideoKey)}
        />
      ) : theme.heroStyle === "globe" && globe ? (
        <HeroGlobe
          data={globe}
          isSignedIn={user !== null}
          siteName={theme.siteName}
          siteTagline={theme.siteTagline}
        />
      ) : theme.heroStyle === "parallax" ? (
        <HeroParallaxHome
          isSignedIn={user !== null}
          siteName={theme.siteName}
          siteTagline={theme.siteTagline}
          slides={slides}
        />
      ) : theme.heroStyle === "marquee" ? (
        <HeroMarqueeHome
          isSignedIn={user !== null}
          siteName={theme.siteName}
          siteTagline={theme.siteTagline}
          slides={slides}
        />
      ) : theme.heroStyle === "slider" ? (
        <HeroSliderHome
          isSignedIn={user !== null}
          words={theme.sliderHeroWords}
          siteName={theme.siteName}
          siteTagline={theme.siteTagline}
          slides={slides}
        />
      ) : PHOTO_HEROES[theme.heroStyle] ? (
        (() => {
          const PhotoHero = PHOTO_HEROES[theme.heroStyle]!;
          return (
            <PhotoHero
              bgPattern={theme.heroBgPattern}
              isSignedIn={user !== null}
              siteName={theme.siteName}
              siteTagline={theme.siteTagline}
              slides={slides}
            />
          );
        })()
      ) : (
        <HeroSection
          isSignedIn={user !== null}
          bgPattern={theme.heroBgPattern}
          siteName={theme.siteName}
          siteTagline={theme.siteTagline}
        />
      )}
      <Suspense fallback={<div aria-hidden className="min-h-[60vh]" />}>
        <HomeSections slides={slides} theme={theme} user={user} />
      </Suspense>
    </div>
  );
}

/** Everything below the hero. Streams in after the hero has painted; its
 * data is cached, so it's normally there a moment later. */
async function HomeSections({
  slides,
  theme,
  user,
}: {
  slides: Awaited<ReturnType<typeof getHomepageSlides>>;
  theme: Awaited<ReturnType<typeof getSiteTheme>>;
  user: Awaited<ReturnType<typeof getOptionalUser>>;
}) {
  const [testimonials, faqData, memberNotices, progressEnabled] = await Promise.all([
    getHomepageTestimonials(),
    getHomepageFaqData(),
    user ? getHomepageMemberNotices(user.id, user.firstName) : Promise.resolve([]),
    getProgressEnabled(),
  ]);

  return (
    <HomeWelcome
      aboutExpect={theme.aboutExpect}
      aboutExpectHeading={theme.aboutExpectHeading}
      aboutGoals={theme.aboutGoals}
      aboutGoalsHeading={theme.aboutGoalsHeading}
      aboutPlaces={theme.aboutPlaces}
      aboutPlacesHeading={theme.aboutPlacesHeading}
      aboutRules={theme.aboutRules}
      aboutRulesHeading={theme.aboutRulesHeading}
      facebookGroupUrl={theme.facebookGroupUrl}
      faqCategories={faqData.categories}
      faqSectionIntro={theme.faqSectionIntro}
      faqSectionTitle={theme.faqSectionTitle}
      faqs={faqData.faqs}
      homepageSectionOrder={theme.homepageSectionOrder}
      howThisStartedBody={theme.howThisStartedBody}
      howThisStartedEyebrow={theme.howThisStartedEyebrow}
      howThisStartedTeaser={theme.howThisStartedTeaser}
      howThisStartedTitle={theme.howThisStartedTitle}
      isSignedIn={user !== null}
      memberNotices={memberNotices}
      memberNoticesEnabled={theme.memberNoticesEnabled}
      photos={slides}
      // The Photo slider hero already shows these photos — don't repeat them below.
      photosEnabled={theme.carouselEnabled && theme.heroStyle !== "slider"}
      titleRevealEnabled={theme.titleRevealEnabled}
      progressEnabled={progressEnabled}
      sectionBgPatterns={{
        howThisStarted: theme.howThisStartedBgPattern,
        testimonials: theme.testimonialsBgPattern,
        memberNotices: theme.memberNoticesBgPattern,
        faqs: theme.faqsBgPattern,
      }}
      testimonials={testimonials}
      testimonialsSectionEyebrow={theme.testimonialsSectionEyebrow}
      testimonialsSectionIntro={theme.testimonialsSectionIntro}
      testimonialsSectionTitle={theme.testimonialsSectionTitle}
    />
  );
}
