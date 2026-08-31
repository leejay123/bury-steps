"use client";

import { CookieConsent } from "@/components/blocks/cookie-consent";

export function SiteCookieConsent() {
  return (
    <CookieConsent
      description="We use cookies so the site can work — for example to keep you signed in. We do not use them for advertising."
      learnMoreHref="/privacy-policy"
      variant="small"
    />
  );
}
