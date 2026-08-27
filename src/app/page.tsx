import { HeroSection } from "@/components/hero";
import { HomeWelcome } from "@/components/home-welcome";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { getSiteTheme } from "@/lib/site-theme";
import { HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { accountPortalHref, appUrl } from "@/lib/urls";

export const revalidate = HOMEPAGE_REVALIDATE_SECONDS;

export default async function Home() {
  const origin = appUrl();
  const [slides, testimonials, faqData, theme] = await Promise.all([
    getHomepageSlides(),
    getHomepageTestimonials(),
    getHomepageFaqData(),
    getSiteTheme(),
  ]);

  return (
    <div className="relative -mx-4 -mt-8 md:-mx-8">
      <HeroSection
        carouselEnabled={theme.carouselEnabled}
        signInHref={accountPortalHref("sign-in", `${origin}/dashboard`)}
        signUpHref={accountPortalHref("sign-up", `${origin}/dashboard`)}
        slides={slides}
      />
      <HomeWelcome
        faqCategories={faqData.categories}
        faqs={faqData.faqs}
        testimonials={testimonials}
      />
    </div>
  );
}
