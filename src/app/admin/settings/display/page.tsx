import { requireAdmin } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../settings-page";
import { AboutListsSettings } from "./about-lists-settings";
import { CookieConsentSettings } from "./cookie-consent-settings";
import { DisplaySettings } from "./display-form";
import { FacebookGroupSettings } from "./facebook-group-settings";
import { FaqSectionCopySettings } from "./faq-section-copy-settings";
import { HomepageSectionsSettings } from "./homepage-sections-settings";
import { HowThisStartedCopySettings } from "./how-this-started-copy-settings";
import { SiteBrandingSettings } from "./site-branding-settings";

export const dynamic = "force-dynamic";

export default async function DisplaySettingsPage() {
  await requireAdmin();
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="Name, tagline, Facebook link, homepage copy and sections, cookie notice, and back to top."
      previewHref="/"
      title="Display"
    >
      <SiteBrandingSettings siteName={theme.siteName} siteTagline={theme.siteTagline} />
      <FacebookGroupSettings facebookGroupUrl={theme.facebookGroupUrl} />
      <HomepageSectionsSettings
        faqsEnabled={theme.faqsEnabled}
        howThisStartedEnabled={theme.howThisStartedEnabled}
        howWalksWorkEnabled={theme.howWalksWorkEnabled}
        memberNoticesEnabled={theme.memberNoticesEnabled}
        testimonialsEnabled={theme.testimonialsEnabled}
      />
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
      <FaqSectionCopySettings
        faqSectionIntro={theme.faqSectionIntro}
        faqSectionTitle={theme.faqSectionTitle}
      />
      <CookieConsentSettings variant={theme.cookieConsentVariant} />
      <DisplaySettings scrollToTopEnabled={theme.scrollToTopEnabled} />
    </SettingsPage>
  );
}
