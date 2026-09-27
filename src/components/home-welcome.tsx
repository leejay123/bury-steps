import { Fragment, type ReactNode } from "react";
import { HomeAboutDrawer } from "@/components/home-about-drawer";
import { FeatureSection } from "@/components/feature-section";
import { MemberFeatureSection } from "@/components/member-feature-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FaqsSection } from "@/components/faqs-section";
import {
  HomeMemberNoticesSection,
  type HomepageNoticeSlide,
} from "@/components/home-member-notices";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HomeCta } from "@/components/home-cta";
import { Button } from "@/components/ui/button";
import type { TestimonialView } from "@/lib/testimonials";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import type { AboutRule } from "@/lib/homepage-copy";
import type { HomepageSectionId } from "@/lib/homepage-sections";
import { SectionBackground } from "@/components/section-background";
import type { SectionBgPattern } from "@/lib/section-background";

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
  isSignedIn,
  memberNotices,
  memberNoticesEnabled,
  progressEnabled,
  sectionBgPatterns,
  signInHref,
  signUpHref,
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
  /** Swaps the "how this group works" explainer for a bento grid of what a
   * member can already do — the sign-up/clock-in walkthrough stops being
   * useful once someone's actually joined. */
  isSignedIn: boolean;
  memberNotices: HomepageNoticeSlide[];
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
  signInHref: string;
  signUpHref: string;
  testimonials: TestimonialView[];
  testimonialsSectionEyebrow: string;
  testimonialsSectionIntro: string;
  testimonialsSectionTitle: string;
}) {
  const sections: Record<HomepageSectionId, ReactNode | null> = {
    howWalksWork: isSignedIn ? (
      <MemberFeatureSection progressEnabled={progressEnabled} />
    ) : (
      <FeatureSection />
    ),
    howThisStarted: (
      <section className="grid gap-10 px-4 py-10 md:grid-cols-2 md:px-6 md:py-14">
        <div className="flex flex-col items-start gap-4">
          {howThisStartedEyebrow ? (
            <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">
              {howThisStartedEyebrow}
            </p>
          ) : null}
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {howThisStartedTitle}
          </h2>
          <p className="text-muted-foreground md:text-lg">{howThisStartedTeaser}</p>
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
            trigger={<Button variant="outline">Read more</Button>}
          />
        </div>
        {aboutExpect.length > 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-muted-foreground">{aboutExpectHeading}</p>
            <ol className="relative flex flex-col gap-5 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
              {aboutExpect.map((item, index) => (
                <li className="relative flex items-start gap-4" key={item}>
                  <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium text-foreground shadow-xs">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-foreground">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>
    ),
    memberNotices:
      memberNoticesEnabled && memberNotices.length > 0 ? (
        <HomeMemberNoticesSection notices={memberNotices} />
      ) : null,
    testimonials:
      testimonials.length > 0 ? (
        <TestimonialsSection
          eyebrow={testimonialsSectionEyebrow}
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
  // howWalksWork has no background pattern picker (not asked for) — always
  // none. howThisStarted's pattern is drawn by HeroCopy itself above (its
  // own internal background slot), not this shared overlay — applying both
  // would double-layer the pattern.
  const bgPatterns: Record<HomepageSectionId, SectionBgPattern> = {
    howWalksWork: "none",
    ...sectionBgPatterns,
    howThisStarted: "none",
  };

  return (
    <>
      {visible.map((id, index) => (
        <Fragment key={id}>
          <SectionShell bgPattern={bgPatterns[id]} id={id} showDividerAfter={index < visible.length}>
            {sections[id]}
          </SectionShell>
        </Fragment>
      ))}
      <HomeCta isSignedIn={isSignedIn} signInHref={signInHref} signUpHref={signUpHref} />
    </>
  );
}
