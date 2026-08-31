import { requireAdmin } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage } from "../settings-page";
import { CookieConsentSettings } from "./cookie-consent-settings";
import { DisplaySettings } from "./display-form";
import { FacebookGroupSettings } from "./facebook-group-settings";
import { HomepageSectionsSettings } from "./homepage-sections-settings";
import { SiteBrandingSettings } from "./site-branding-settings";

export const dynamic = "force-dynamic";

export default async function DisplaySettingsPage() {
  await requireAdmin();
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="Name, tagline, Facebook link, homepage sections, cookie notice, and back to top."
      title="Display"
    >
      <SiteBrandingSettings siteName={theme.siteName} siteTagline={theme.siteTagline} />
      <FacebookGroupSettings facebookGroupUrl={theme.facebookGroupUrl} />
      <HomepageSectionsSettings
        faqsEnabled={theme.faqsEnabled}
        howWalksWorkEnabled={theme.howWalksWorkEnabled}
        testimonialsEnabled={theme.testimonialsEnabled}
      />
      <CookieConsentSettings variant={theme.cookieConsentVariant} />
      <DisplaySettings scrollToTopEnabled={theme.scrollToTopEnabled} />
    </SettingsPage>
  );
}
