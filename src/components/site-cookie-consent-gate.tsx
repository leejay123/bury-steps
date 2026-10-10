import { getSiteTheme } from "@/lib/site-theme";
import { SiteCookieConsent } from "@/components/site-cookie-consent";

/** Hides the notice before it's drawn when this browser has already answered it. */
const ANSWERED_SCRIPT = `try{if(/(?:^|; )cookieConsent=(true|false)(?:;|$)/.test(document.cookie))document.documentElement.setAttribute("data-cookie-answered","")}catch(e){}`;

/**
 * The cookie notice is part of the ready-made page (no per-visitor cookie
 * read on the server), so it's there on the first paint instead of arriving
 * a moment after the page. Whether this browser has answered is checked by
 * the little script just before it, which hides it straight away (see
 * globals.css); the notice's own check then removes it.
 */
export async function SiteCookieConsentGate() {
  const theme = await getSiteTheme();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ANSWERED_SCRIPT }} />
      <SiteCookieConsent initiallyOpen variant={theme.cookieConsentVariant} />
    </>
  );
}
