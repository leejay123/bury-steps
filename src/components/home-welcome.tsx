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
  faqCategories,
  faqs,
  testimonials,
}: {
  faqCategories: FaqCategoryView[];
  faqs: FaqView[];
  testimonials: TestimonialView[];
}) {
  return (
    <>
      <FeatureSection />
      <section className="relative">
        <HeroCopy
          actions={
            <HomeAboutDrawer
              trigger={
                <Button variant="outline">Read more</Button>
              }
            />
          }
          eyebrow="Kindness · Friendship · Welcome"
          title="How this started"
          titleAs="h2"
        >
          <p>
            Just eight weeks ago, in June, I could not find the motivation to walk alone. Within
            hours of taking that first step I started this group, with no idea what it would become.
          </p>
        </HeroCopy>
        <FullWidthDivider position="bottom" />
      </section>
      <TestimonialsSection testimonials={testimonials} />
      <FaqsSection categories={faqCategories} faqs={faqs} />
    </>
  );
}
