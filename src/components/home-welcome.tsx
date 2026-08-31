import { HomeAboutDrawer } from "@/components/home-about-drawer";
import { FeatureSection } from "@/components/feature-section";
import { HeroCopy } from "@/components/hero-copy";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FaqsSection } from "@/components/faqs-section";
import { HomeMemberNoticesSection } from "@/components/home-member-notices";
import { FullWidthDivider } from "@/components/full-width-divider";
import { Button } from "@/components/ui/button";
import type { TestimonialView } from "@/lib/testimonials";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import type { AboutRule } from "@/lib/homepage-copy";

export function HomeWelcome({
  aboutExpect,
  aboutGoals,
  aboutPlaces,
  aboutRules,
  facebookGroupUrl,
  faqCategories,
  faqSectionIntro,
  faqSectionTitle,
  faqs,
  faqsEnabled,
  howThisStartedBody,
  howThisStartedEnabled,
  howThisStartedEyebrow,
  howThisStartedTeaser,
  howThisStartedTitle,
  howWalksWorkEnabled,
  memberNoticesEnabled,
  testimonials,
  testimonialsEnabled,
}: {
  aboutExpect: string[];
  aboutGoals: string[];
  aboutPlaces: string[];
  aboutRules: AboutRule[];
  facebookGroupUrl: string;
  faqCategories: FaqCategoryView[];
  faqSectionIntro: string;
  faqSectionTitle: string;
  faqs: FaqView[];
  faqsEnabled: boolean;
  howThisStartedBody: string;
  howThisStartedEnabled: boolean;
  howThisStartedEyebrow: string;
  howThisStartedTeaser: string;
  howThisStartedTitle: string;
  howWalksWorkEnabled: boolean;
  memberNoticesEnabled: boolean;
  testimonials: TestimonialView[];
  testimonialsEnabled: boolean;
}) {
  const showTestimonials = testimonialsEnabled && testimonials.length > 0;
  const showFaqs = faqsEnabled && faqs.length > 0;

  return (
    <>
      {howWalksWorkEnabled ? <FeatureSection /> : null}
      {howThisStartedEnabled ? (
        <section className="relative">
          <HeroCopy
            actions={
              <HomeAboutDrawer
                aboutExpect={aboutExpect}
                aboutGoals={aboutGoals}
                aboutPlaces={aboutPlaces}
                aboutRules={aboutRules}
                facebookGroupUrl={facebookGroupUrl}
                howThisStartedBody={howThisStartedBody}
                howThisStartedTitle={howThisStartedTitle}
                trigger={<Button variant="outline">Read more</Button>}
              />
            }
            eyebrow={howThisStartedEyebrow || null}
            title={howThisStartedTitle}
            titleAs="h2"
          >
            <p>{howThisStartedTeaser}</p>
          </HeroCopy>
          <FullWidthDivider position="bottom" />
        </section>
      ) : null}
      <HomeMemberNoticesSection enabled={memberNoticesEnabled} />
      {showTestimonials ? <TestimonialsSection testimonials={testimonials} /> : null}
      {showFaqs ? (
        <FaqsSection
          categories={faqCategories}
          facebookGroupUrl={facebookGroupUrl}
          faqs={faqs}
          intro={faqSectionIntro}
          title={faqSectionTitle}
        />
      ) : null}
    </>
  );
}
