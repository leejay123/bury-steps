import { headers } from "next/headers";
import { HeroSection } from "@/components/hero";
import { HomeWelcome } from "@/components/home-welcome";
import { getOptionalUser } from "@/lib/auth";
import { getHomepageSlides } from "@/lib/homepage-slides";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getHomepageFaqs } from "@/lib/homepage-faqs";
import { getSiteTheme } from "@/lib/site-theme";
import { accountPortalHref } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getOptionalUser();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const walksHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  const [slides, testimonials, faqs, theme] = await Promise.all([
    getHomepageSlides(),
    getHomepageTestimonials(),
    getHomepageFaqs(),
    getSiteTheme(),
  ]);

  return (
    <div className="relative -mx-4 -mt-8 md:-mx-8">
      <HeroSection
        carouselEnabled={theme.carouselEnabled}
        signInHref={accountPortalHref("sign-in", `${origin}/dashboard`)}
        signUpHref={accountPortalHref("sign-up", `${origin}/dashboard`)}
        signedIn={Boolean(user)}
        slides={slides}
        walksHref={walksHref}
      />
      <HomeWelcome testimonials={testimonials} faqs={faqs} />
    </div>
  );
}
