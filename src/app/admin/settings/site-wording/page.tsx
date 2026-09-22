import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { HowThisStartedCopySettings } from "./how-this-started-copy-settings";
import { AboutListsSettings } from "./about-lists-settings";
import { TestimonialsSectionCopySettings } from "./testimonials-section-copy-settings";
import { FaqSectionCopySettings } from "./faq-section-copy-settings";
import { WalkPageCopySettings } from "./walk-page-copy-settings";

export const dynamic = "force-dynamic";

export default async function SiteWordingSettingsPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="Headings and body copy for homepage sections and the walk-page cards. Quotes and questions themselves are managed under Settings."
      previewHref="/"
      title="Site wording"
    >
      <SettingsSectionGroup
        description="Headings and body copy for homepage sections. Quotes and questions are managed under Settings."
        title="Homepage copy"
      >
        <HowThisStartedCopySettings
          howThisStartedBody={theme.howThisStartedBody}
          howThisStartedEyebrow={theme.howThisStartedEyebrow}
          howThisStartedTeaser={theme.howThisStartedTeaser}
          howThisStartedTitle={theme.howThisStartedTitle}
        />
        <AboutListsSettings
          aboutExpectHeading={theme.aboutExpectHeading}
          aboutExpectText={theme.aboutExpectText}
          aboutGoalsHeading={theme.aboutGoalsHeading}
          aboutGoalsText={theme.aboutGoalsText}
          aboutPlacesHeading={theme.aboutPlacesHeading}
          aboutPlacesText={theme.aboutPlacesText}
          aboutRulesHeading={theme.aboutRulesHeading}
          aboutRulesText={theme.aboutRulesText}
        />
        <TestimonialsSectionCopySettings
          testimonialsSectionEyebrow={theme.testimonialsSectionEyebrow}
          testimonialsSectionIntro={theme.testimonialsSectionIntro}
          testimonialsSectionTitle={theme.testimonialsSectionTitle}
        />
        <FaqSectionCopySettings
          faqSectionIntro={theme.faqSectionIntro}
          faqSectionTitle={theme.faqSectionTitle}
        />
        <WalkPageCopySettings
          beforeYouSetOffTipsText={theme.beforeYouSetOffTipsText}
          howWalksWorkStepsText={theme.howWalksWorkStepsText}
        />
      </SettingsSectionGroup>
    </SettingsPage>
  );
}
