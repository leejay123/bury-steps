import { requirePermission } from "@/lib/auth";
import { getSiteTheme } from "@/lib/site-theme";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { SiteBrandingSettings } from "./site-branding-settings";
import { SiteLogoSettings } from "./site-logo-settings";
import { SiteFaviconSettings } from "./site-favicon-settings";
import { ReportBannerSettings } from "./report-banner-settings";
import { FacebookGroupSettings } from "./facebook-group-settings";

export const dynamic = "force-dynamic";

export default async function BrandingSettingsPage() {
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return (
    <SettingsPage
      description="How the site introduces itself — name, tagline, logo, favicon, and the Facebook link."
      previewHref="/"
      title="Branding"
    >
      <SettingsSectionGroup
        description="How the site introduces itself in the hero, tabs, and share previews."
        title="Identity"
      >
        <SiteBrandingSettings siteName={theme.siteName} siteTagline={theme.siteTagline} />
        <SiteLogoSettings hasCustomLogo={theme.hasCustomLogo} logoSrc={theme.logoSrc} />
        <SiteFaviconSettings
          faviconSrc={theme.faviconSrc}
          hasCustomFavicon={theme.hasCustomFavicon}
        />
        <ReportBannerSettings reportBannerSrc={theme.reportBannerSrc} />
        <FacebookGroupSettings facebookGroupUrl={theme.facebookGroupUrl} />
      </SettingsSectionGroup>
    </SettingsPage>
  );
}
