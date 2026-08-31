import { requireAdmin } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage, SettingsSectionGroup, SettingsSectionPair } from "../settings-page";
import { AboutListsSettings } from "./about-lists-settings";
import { CookieConsentSettings } from "./cookie-consent-settings";
import { DisplaySettings } from "./display-form";
import { DisplaySettingsLayout } from "./display-settings-layout";
import { FacebookGroupSettings } from "./facebook-group-settings";
import { FaqSectionCopySettings } from "./faq-section-copy-settings";
import { HomepageSectionsSettings } from "./homepage-sections-settings";
import { HowThisStartedCopySettings } from "./how-this-started-copy-settings";
import { SiteBrandingSettings } from "./site-branding-settings";
import { TestimonialsSectionCopySettings } from "./testimonials-section-copy-settings";

export const dynamic = "force-dynamic";

export default async function DisplaySettingsPage() {
  await requireAdmin();
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      contentClassName="py-8 md:py-10"
      description="Name, tagline, Facebook link, homepage copy and section order, cookie notice, and back to top."
      previewHref="/"
      title="Display"
    >
      <DisplaySettingsLayout>
        <SettingsSectionGroup
          description="How the site introduces itself in the hero, tabs, and share previews."
          id="identity"
          title="Identity"
        >
          <SiteBrandingSettings siteName={theme.siteName} siteTagline={theme.siteTagline} />
          <FacebookGroupSettings facebookGroupUrl={theme.facebookGroupUrl} />
        </SettingsSectionGroup>

        <SettingsSectionGroup
          description="What appears below the hero and in what order."
          id="homepage-layout"
          title="Layout"
        >
          <HomepageSectionsSettings sectionOrder={theme.homepageSectionOrder} />
        </SettingsSectionGroup>

        <SettingsSectionGroup
          description="Headings and body copy for homepage sections. Quotes and questions are managed under Settings."
          id="homepage-copy"
          title="Homepage copy"
        >
          <HowThisStartedCopySettings
            howThisStartedBody={theme.howThisStartedBody}
            howThisStartedEyebrow={theme.howThisStartedEyebrow}
            howThisStartedTeaser={theme.howThisStartedTeaser}
            howThisStartedTitle={theme.howThisStartedTitle}
          />
          <AboutListsSettings
            aboutExpectText={theme.aboutExpectText}
            aboutGoalsText={theme.aboutGoalsText}
            aboutPlacesText={theme.aboutPlacesText}
            aboutRulesText={theme.aboutRulesText}
          />
          <SettingsSectionPair>
            <TestimonialsSectionCopySettings
              testimonialsSectionIntro={theme.testimonialsSectionIntro}
              testimonialsSectionTitle={theme.testimonialsSectionTitle}
            />
            <FaqSectionCopySettings
              faqSectionIntro={theme.faqSectionIntro}
              faqSectionTitle={theme.faqSectionTitle}
            />
          </SettingsSectionPair>
        </SettingsSectionGroup>

        <SettingsSectionGroup
          description="Sitewide behaviour that is not part of the homepage story."
          id="site-chrome"
          title="Site chrome"
        >
          <CookieConsentSettings variant={theme.cookieConsentVariant} />
          <DisplaySettings scrollToTopEnabled={theme.scrollToTopEnabled} />
        </SettingsSectionGroup>
      </DisplaySettingsLayout>
    </SettingsPage>
  );
}
