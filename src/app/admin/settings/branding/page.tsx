import { RevealSuspense } from "@/components/reveal-suspense";
import { cacheLife } from "next/cache";
import { PRIVATE_SAVED_COPY } from "@/lib/private-saved-copy";
import { requirePermission } from "@/lib/auth";
import { defaultTheme, getSiteTheme, type SiteTheme } from "@/lib/site-theme";
import { SettingsPage, SettingsSectionGroup } from "../settings-page";
import { SettingsMask } from "../settings-mask";
import { PlaceholderPreview } from "@/components/placeholder-preview";

import { SiteBrandingSettings } from "./site-branding-settings";
import { SiteLogoSettings } from "./site-logo-settings";
import { SiteFaviconSettings } from "./site-favicon-settings";
import { ReportBannerSettings } from "./report-banner-settings";
import { FacebookGroupSettings } from "./facebook-group-settings";
import { SiteFontSettings } from "./site-font-settings";
import { TextSizeSettings } from "./text-size-settings";



/** Fetched ahead (from the menu, the Settings table, or its tabs), so it opens with its settings there. */
export const prefetch = "partial";

export default function BrandingSettingsPage() {
  // Title and description are part of the ready-made page; the settings
  // themselves (and the access check) fill in just after.
  return (
    <SettingsPage
      description="How the site introduces itself — name, tagline, font, logo, favicon, and the Facebook link."
      previewHref="/"
      title="Branding"
    >
      <RevealSuspense fallback={<SettingsFallback />}>
        <PlaceholderPreview fallback={<SettingsFallback />}>
          <BrandingSettingsPageContent />
        </PlaceholderPreview>
      </RevealSuspense>
    </SettingsPage>
  );
}

async function BrandingSettingsPageContent() {
  // A private saved copy (this browser only, five minutes), so the page
  // can be fetched ahead with its settings already in it.
  "use cache: private";
  cacheLife(PRIVATE_SAVED_COPY);
  await requirePermission("permDisplay");
  const theme = await getSiteTheme();

  return <SettingsView theme={theme} />;
}

/** The page drawn from its saved values (also its placeholder, with stand-ins). */
function SettingsView({ theme }: { theme: SiteTheme }) {
  return (
    <>
      <SettingsSectionGroup
        description="How the site introduces itself in the hero, tabs, and share previews."
        title="Identity"
      >
        <SiteBrandingSettings siteName={theme.siteName} siteTagline={theme.siteTagline} />
        <SiteFontSettings font={theme.siteFont} />
        <TextSizeSettings sizes={theme.textSizes} />
        <SiteLogoSettings hasCustomLogo={theme.hasCustomLogo} logoSrc={theme.logoSrc} />
        <SiteFaviconSettings
          faviconSrc={theme.faviconSrc}
          hasCustomFavicon={theme.hasCustomFavicon}
        />
        <ReportBannerSettings reportBannerSrc={theme.reportBannerSrc} />
        <FacebookGroupSettings facebookGroupUrl={theme.facebookGroupUrl} />
      </SettingsSectionGroup>
    </>
  );
}

/** While it loads: the page drawn with the site's default values, greyed (SettingsMask). */
function SettingsFallback() {
  return (
    <SettingsMask>
      <SettingsView theme={defaultTheme()} />
    </SettingsMask>
  );
}
