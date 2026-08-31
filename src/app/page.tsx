import { HeroSection } from "@/components/hero";
import { HomeWelcome } from "@/components/home-welcome";
import { getOptionalUser } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { getHomepageMemberNotices } from "@/lib/site-notices";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { getSiteTheme } from "@/lib/site-theme";
import { accountPortalHref, appUrl } from "@/lib/urls";

// Must be a numeric literal so Next can statically detect ISR.
export const revalidate = 120;

export default async function Home() {
  const origin = appUrl();
  const user = await getOptionalUser();
  const [slides, testimonials, faqData, theme, memberNotices] = await Promise.all([
    getHomepageSlides(),
    getHomepageTestimonials(),
    getHomepageFaqData(),
    getSiteTheme(),
    user ? getHomepageMemberNotices(user.id, user.firstName) : Promise.resolve([]),
  ]);

  return (
    <div className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
      <HeroSection
        carouselEnabled={theme.carouselEnabled}
        signInHref={accountPortalHref("sign-in", `${origin}/dashboard`)}
        signUpHref={accountPortalHref("sign-up", `${origin}/dashboard`)}
        siteName={theme.siteName}
        siteTagline={theme.siteTagline}
        slides={slides}
      />
      <HomeWelcome
        aboutExpect={theme.aboutExpect}
        aboutGoals={theme.aboutGoals}
        aboutPlaces={theme.aboutPlaces}
        aboutRules={theme.aboutRules}
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
        memberNotices={memberNotices}
        testimonials={testimonials}
        testimonialsSectionIntro={theme.testimonialsSectionIntro}
        testimonialsSectionTitle={theme.testimonialsSectionTitle}
      />
    </div>
  );
}
