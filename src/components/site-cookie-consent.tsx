"use client";

import { CookieConsent } from "@/components/blocks/cookie-consent";
import type { CookieConsentVariant } from "@/lib/cookie-consent-variant";

export function SiteCookieConsent({ initiallyOpen, variant }: { initiallyOpen: boolean; variant: CookieConsentVariant }) {
  return (
    <CookieConsent
      initiallyOpen={initiallyOpen}
      description="Cookies keep you signed in. Never used for ads."
      learnMoreHref="/privacy-policy"
      variant={variant}
    />
  );
}
