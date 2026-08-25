import { HomeAboutDialog } from "@/components/home-about-dialog";
import { FeatureSection } from "@/components/feature-section";
import { HeroCopy } from "@/components/hero";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FaqsSection } from "@/components/faqs-section";
import { Button } from "@/components/ui/button";
import type { TestimonialView } from "@/lib/testimonials";
import type { FaqView } from "@/lib/faqs";

export function HomeWelcome({
  testimonials,
  faqs,
}: {
  testimonials: TestimonialView[];
  faqs: FaqView[];
}) {
  return (
    <>
      <FeatureSection />
      <section>
        <HeroCopy
          actions={
            <HomeAboutDialog
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
      </section>
      <TestimonialsSection testimonials={testimonials} />
      <FaqsSection faqs={faqs} />
    </>
  );
}
