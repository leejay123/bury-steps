import { HomeAboutDrawer } from "@/components/home-about-drawer";
import { FeatureSection } from "@/components/feature-section";
import { HeroCopy } from "@/components/hero-copy";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FaqsSection } from "@/components/faqs-section";
import { FullWidthDivider } from "@/components/full-width-divider";
import { Button } from "@/components/ui/button";
import type { TestimonialView } from "@/lib/testimonials";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";

export function HomeWelcome({
  facebookGroupUrl,
  faqCategories,
  faqSectionIntro,
  faqSectionTitle,
  faqs,
  faqsEnabled,
  howWalksWorkEnabled,
  testimonials,
  testimonialsEnabled,
}: {
  facebookGroupUrl: string;
  faqCategories: FaqCategoryView[];
  faqSectionIntro: string;
  faqSectionTitle: string;
  faqs: FaqView[];
  faqsEnabled: boolean;
  howWalksWorkEnabled: boolean;
  testimonials: TestimonialView[];
  testimonialsEnabled: boolean;
}) {
  return (
    <>
      {howWalksWorkEnabled ? <FeatureSection /> : null}
      <section className="relative">
        <HeroCopy
          actions={
            <HomeAboutDrawer
              facebookGroupUrl={facebookGroupUrl}
              trigger={<Button variant="outline">Read more</Button>}
            />
          }
          eyebrow="Kindness · Friendship · Welcome"
          title="How this started"
          titleAs="h2"
        >
          <p>
            What started out as a self-help mission to get myself fit after my diabetes diagnosis
            began with a simple goal: walking four miles a day with the dogs after work. It has
            grown into a community of walkers supporting one another week after week.
          </p>
        </HeroCopy>
        <FullWidthDivider position="bottom" />
      </section>
      {testimonialsEnabled ? <TestimonialsSection testimonials={testimonials} /> : null}
      {faqsEnabled ? (
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
