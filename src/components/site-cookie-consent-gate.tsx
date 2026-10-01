import { cookies } from "next/headers";
import { getSiteTheme } from "@/lib/site-theme";
import { SiteCookieConsent } from "@/components/site-cookie-consent";

/**
 * Loads the cookie-banner variant without blocking the root layout stream.
 */
export async function SiteCookieConsentGate() {
  const [theme, cookieStore] = await Promise.all([getSiteTheme(), cookies()]);
  // No answer yet: send the banner in the page itself (see initiallyOpen).
  const answered = /^(true|false)$/.test(cookieStore.get("cookieConsent")?.value ?? "");
  return <SiteCookieConsent initiallyOpen={!answered} variant={theme.cookieConsentVariant} />;
}
