import { HeroSection } from "@/components/hero";
import { HeroCinematic } from "@/components/hero-cinematic";
import { HomeWelcome } from "@/components/home-welcome";
import { getOptionalUser } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { getHomepageMemberNotices } from "@/lib/site-notices";
import { getProgressEnabled } from "@/lib/progress-settings";
import { heroVideoPoster, heroVideoSrc } from "@/lib/hero-style";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";

// Must be a numeric literal so Next can statically detect ISR.
export const revalidate = 120;

export default async function Home() {
  const origin = appUrl();
  // Auth and the homepage queries do not depend on each other. Starting
  // them together means the page is not stuck waiting for sign-in before
  // the hero, FAQs, and quotes even begin.
  const userPromise = getOptionalUser();
  const slidesPromise = getHomepageSlides();
  const testimonialsPromise = getHomepageTestimonials();
  const faqPromise = getHomepageFaqData();
  const themePromise = getSiteTheme();
  const progressPromise = getProgressEnabled();
  const user = await userPromise;
  const [slides, testimonials, faqData, theme, memberNotices, progressEnabled] = await Promise.all([
    slidesPromise,
    testimonialsPromise,
    faqPromise,
    themePromise,
    user ? getHomepageMemberNotices(user.id, user.firstName) : Promise.resolve([]),
    progressPromise,
  ]);
  const signInHref = accountPortalHref("sign-in", `${origin}${AFTER_AUTH_PATH}`);
  const signUpHref = accountPortalHref("sign-up", `${origin}${AFTER_AUTH_PATH}`);

  return (
    <div className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      {theme.heroStyle === "cinematic" ? (
        <HeroCinematic
          overlayOpacity={theme.heroOverlayOpacity}
          signInHref={signInHref}
          signUpHref={signUpHref}
          siteName={theme.siteName}
          siteTagline={theme.siteTagline}
          textColor={theme.heroTextColor}
          videoPoster={heroVideoPoster(theme.heroVideoKey)}
          videoSrc={heroVideoSrc(theme.heroVideoKey)}
        />
      ) : (
        <HeroSection
          bgPattern={theme.heroBgPattern}
          carouselEnabled={theme.carouselEnabled}
          signInHref={signInHref}
          signUpHref={signUpHref}
          siteName={theme.siteName}
          siteTagline={theme.siteTagline}
          slides={slides}
        />
      )}
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
    </div>
  );
}
