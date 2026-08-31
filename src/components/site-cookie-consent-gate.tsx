import { getSiteTheme } from "@/lib/site-theme";
import { SiteCookieConsent } from "@/components/site-cookie-consent";

/**
 * Loads the cookie-banner variant without blocking the root layout stream.
 */
export async function SiteCookieConsentGate() {
  const theme = await getSiteTheme();
  return <SiteCookieConsent variant={theme.cookieConsentVariant} />;
}
