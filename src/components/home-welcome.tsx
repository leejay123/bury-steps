import { Fragment, type ReactNode } from "react";
import { HomeAboutDrawer } from "@/components/home-about-drawer";
import { FeatureSection } from "@/components/feature-section";
import { MemberFeatureSection } from "@/components/member-feature-section";
import { HeroCopy } from "@/components/hero-copy";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FaqsSection } from "@/components/faqs-section";
import { FullWidthDivider } from "@/components/full-width-divider";
import type { TestimonialView } from "@/lib/testimonials";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import type { AboutRule } from "@/lib/homepage-copy";
import type { HomepageSectionId } from "@/lib/homepage-sections";
import { SectionBackground } from "@/components/section-background";
import type { SectionBgPattern } from "@/lib/section-background";
import type { SlideView } from "@/lib/slides";
import { WalkPhotoSlider } from "@/components/home-photo-slider";
import { TitleRevealProvider } from "@/components/section-title";

function SectionShell({
  bgPattern = "none",
  children,
  id,
  showDividerAfter,
}: {
  bgPattern?: SectionBgPattern;
  children: ReactNode;
  id: HomepageSectionId;
  showDividerAfter: boolean;
}) {
  return (
    // scroll-mt clears the sticky header so a footer anchor link (e.g.
    // /#faqs) doesn't land with the section's top edge hidden behind it.
    <div className="relative scroll-mt-20" id={id}>
      {bgPattern !== "none" ? (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <SectionBackground pattern={bgPattern} />
        </div>
      ) : null}
      <div className="relative">{children}</div>
      {showDividerAfter ? <FullWidthDivider position="bottom" /> : null}
    </div>
  );
}

export function HomeWelcome({
  aboutExpect,
  aboutExpectHeading,
  aboutGoals,
  aboutGoalsHeading,
  aboutPlaces,
  aboutPlacesHeading,
  aboutRules,
  aboutRulesHeading,
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
  memberNoticesSlot,
  memberNoticesEnabled,
  progressEnabled,
  sectionBgPatterns,
  photos,
  photosEnabled,
  titleRevealEnabled,
  testimonials,
  testimonialsSectionEyebrow,
  testimonialsSectionIntro,
  testimonialsSectionTitle,
}: {
  aboutExpect: string[];
  aboutExpectHeading: string;
  aboutGoals: string[];
  aboutGoalsHeading: string;
  aboutPlaces: string[];
  aboutPlacesHeading: string;
  aboutRules: AboutRule[];
  aboutRulesHeading: string;
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
  /** The members' latest notices, filled in after the login check (nothing
   * for visitors). The cards under the hero are both in the page already;
   * a returning member sees theirs on the first paint. */
  memberNoticesSlot: ReactNode;
  /** Site-wide switch (Settings → Homepage layout → Latest notices) — hides
   * the section entirely when off, even if there are notices. */
  memberNoticesEnabled: boolean;
  /** Site-wide switch (Settings → Site behaviour) — hides the
   * "Track your progress" tile when off. */
  progressEnabled: boolean;
  /** Settings → Homepage layout → Background patterns — per-section choice
   * for howThisStarted/testimonials/memberNotices/faqs (hero has its own,
   * see HeroSection's bgPattern prop). */
  sectionBgPatterns: Record<"howThisStarted" | "testimonials" | "memberNotices" | "faqs", SectionBgPattern>;
  /** Homepage photos for the photo slider section. */
  photos: SlideView[];
  /** Settings → Homepage layout carousel switch — off hides the slider. */
  photosEnabled: boolean;
  /** Settings → Homepage layout — word-by-word reveal on section titles. */
  titleRevealEnabled: boolean;
  testimonials: TestimonialView[];
  testimonialsSectionEyebrow: string;
  testimonialsSectionIntro: string;
  testimonialsSectionTitle: string;
}) {
  const sections: Record<HomepageSectionId, ReactNode | null> = {
    photos: photosEnabled && photos.length > 0 ? <WalkPhotoSlider slides={photos} /> : null,
    // Both are in the first paint. The header's cookie script marks a
    // returning member before this HTML is parsed, and CSS shows their
    // cards straight away — nothing waits for the sign-in check.
    howWalksWork: (
      <>
        <div data-guest-home="">
          <FeatureSection />
        </div>
        <div data-member-home="">
          <MemberFeatureSection progressEnabled={progressEnabled} />
        </div>
      </>
    ),
    howThisStarted: (
      <section>
        <HeroCopy
          bgPattern={sectionBgPatterns.howThisStarted}
          actions={
            <HomeAboutDrawer
              aboutExpect={aboutExpect}
              aboutExpectHeading={aboutExpectHeading}
              aboutGoals={aboutGoals}
              aboutGoalsHeading={aboutGoalsHeading}
              aboutPlaces={aboutPlaces}
              aboutPlacesHeading={aboutPlacesHeading}
              aboutRules={aboutRules}
              aboutRulesHeading={aboutRulesHeading}
              facebookGroupUrl={facebookGroupUrl}
              howThisStartedBody={howThisStartedBody}
              howThisStartedTitle={howThisStartedTitle}
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
    // Members only: filled in after the login check (see page.tsx), so
    // nothing else on the homepage waits for it.
    memberNotices: memberNoticesEnabled ? memberNoticesSlot : null,
    testimonials:
      testimonials.length > 0 ? (
        <TestimonialsSection
          bgPattern={sectionBgPatterns.testimonials}
          eyebrow={testimonialsSectionEyebrow}
          intro={testimonialsSectionIntro}
          testimonials={testimonials}
          title={testimonialsSectionTitle}
        />
      ) : null,
    faqs:
      faqs.length > 0 ? (
        <FaqsSection
          bgPattern={sectionBgPatterns.faqs}
          categories={faqCategories}
          facebookGroupUrl={facebookGroupUrl}
          faqs={faqs}
          intro={faqSectionIntro}
          title={faqSectionTitle}
        />
      ) : null,
  };

  const visible = homepageSectionOrder.filter((id) => sections[id] != null);
  // howWalksWork has no background pattern picker (not asked for) — always
  // none. howThisStarted, testimonials and FAQs draw their pattern behind
  // their heading (HeroCopy's own background slot), not across the whole
  // section: the testimonial cards covered it, and on FAQs it belongs
  // behind the intro, not the questions.
  const bgPatterns: Record<HomepageSectionId, SectionBgPattern> = {
    howWalksWork: "none",
    photos: "none",
    ...sectionBgPatterns,
    howThisStarted: "none",
    testimonials: "none",
    faqs: "none",
  };

  return (
    <TitleRevealProvider enabled={titleRevealEnabled}>
      {visible.map((id, index) => (
        <Fragment key={id}>
          <SectionShell bgPattern={bgPatterns[id]} id={id} showDividerAfter={index < visible.length - 1}>
            {sections[id]}
          </SectionShell>
        </Fragment>
      ))}
    </TitleRevealProvider>
  );
}
