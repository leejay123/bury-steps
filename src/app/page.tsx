import { HeroSection } from "@/components/hero";
import { HeroCinematic } from "@/components/hero-cinematic";
import { HomeWelcome } from "@/components/home-welcome";
import { getOptionalUser } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { getHomepageMemberNotices } from "@/lib/site-notices";
import { getProgressEnabled } from "@/lib/progress-settings";
import { heroVideoSrc } from "@/lib/hero-style";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";
import { AFTER_AUTH_PATH, accountPortalHref, appUrl } from "@/lib/urls";

// Must be a numeric literal so Next can statically detect ISR.
export const revalidate = 120;

export default async function Home() {
  const origin = appUrl();
  const user = await getOptionalUser();
  const [slides, testimonials, faqData, theme, memberNotices, progressEnabled] = await Promise.all([
    getHomepageSlides(),
    getHomepageTestimonials(),
    getHomepageFaqData(),
    getSiteTheme(),
    user ? getHomepageMemberNotices(user.id, user.firstName) : Promise.resolve([]),
    getProgressEnabled(),
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
