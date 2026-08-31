import { Fragment, type ReactNode } from "react";
import { HomeAboutDrawer } from "@/components/home-about-drawer";
import { FeatureSection } from "@/components/feature-section";
import { HeroCopy } from "@/components/hero-copy";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FaqsSection } from "@/components/faqs-section";
import {
  HomeMemberNoticesSection,
  type HomepageNoticeSlide,
} from "@/components/home-member-notices";
import { FullWidthDivider } from "@/components/full-width-divider";
import { Button } from "@/components/ui/button";
import type { TestimonialView } from "@/lib/testimonials";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import type { AboutRule } from "@/lib/homepage-copy";
import type { HomepageSectionId } from "@/lib/homepage-sections";

function SectionShell({
  children,
  showDividerAfter,
}: {
  children: ReactNode;
  showDividerAfter: boolean;
}) {
  return (
    <div className="relative">
      {children}
      {showDividerAfter ? <FullWidthDivider position="bottom" /> : null}
    </div>
  );
}

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
  homepageSectionOrder,
  howThisStartedBody,
  howThisStartedEyebrow,
  howThisStartedTeaser,
  howThisStartedTitle,
  memberNotices,
  testimonials,
  testimonialsSectionIntro,
  testimonialsSectionTitle,
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
  homepageSectionOrder: HomepageSectionId[];
  howThisStartedBody: string;
  howThisStartedEyebrow: string;
  howThisStartedTeaser: string;
  howThisStartedTitle: string;
  memberNotices: HomepageNoticeSlide[];
  testimonials: TestimonialView[];
  testimonialsSectionIntro: string;
  testimonialsSectionTitle: string;
}) {
  const sections: Record<HomepageSectionId, ReactNode | null> = {
    howWalksWork: <FeatureSection />,
    howThisStarted: (
      <section>
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
      </section>
    ),
    memberNotices: <HomeMemberNoticesSection notices={memberNotices} />,
    testimonials:
      testimonials.length > 0 ? (
        <TestimonialsSection
          intro={testimonialsSectionIntro}
          testimonials={testimonials}
          title={testimonialsSectionTitle}
        />
      ) : null,
    faqs:
      faqs.length > 0 ? (
        <FaqsSection
          categories={faqCategories}
          facebookGroupUrl={facebookGroupUrl}
          faqs={faqs}
          intro={faqSectionIntro}
          title={faqSectionTitle}
        />
      ) : null,
  };

  const visible = homepageSectionOrder.filter((id) => sections[id] != null);

  return (
    <>
      {visible.map((id, index) => (
        <Fragment key={id}>
          <SectionShell showDividerAfter={index < visible.length - 1}>
            {sections[id]}
          </SectionShell>
        </Fragment>
      ))}
    </>
  );
}
