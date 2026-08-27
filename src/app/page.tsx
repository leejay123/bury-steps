import { HeroSection } from "@/components/hero";
import { HomeWelcome } from "@/components/home-welcome";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { getSiteTheme } from "@/lib/site-theme";
import { accountPortalHref, appUrl } from "@/lib/urls";

// Must be a numeric literal so Next can statically detect ISR.
export const revalidate = 120;

export default async function Home() {
  const origin = appUrl();
  const slides = await getHomepageSlides();
  const testimonials = await getHomepageTestimonials();
  const faqData = await getHomepageFaqData();
  const theme = await getSiteTheme();

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
