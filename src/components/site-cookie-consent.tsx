"use client";

import { CookieConsent } from "@/components/blocks/cookie-consent";
import type { CookieConsentVariant } from "@/lib/cookie-consent-variant";

export function SiteCookieConsent({ variant }: { variant: CookieConsentVariant }) {
  return (
    <CookieConsent
      description="We use cookies so the site can work — for example to keep you signed in. We do not use them for advertising."
      learnMoreHref="/privacy-policy"
      variant={variant}
    />
  );
}
