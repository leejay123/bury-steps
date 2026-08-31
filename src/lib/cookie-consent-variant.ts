export const COOKIE_CONSENT_VARIANTS = ["default", "small", "mini"] as const;

export type CookieConsentVariant = (typeof COOKIE_CONSENT_VARIANTS)[number];

export const DEFAULT_COOKIE_CONSENT_VARIANT: CookieConsentVariant = "small";

export function parseCookieConsentVariant(raw: string): CookieConsentVariant | null {
  if (COOKIE_CONSENT_VARIANTS.includes(raw as CookieConsentVariant)) {
    return raw as CookieConsentVariant;
  }
  return null;
}

export function cookieConsentVariantLabel(variant: CookieConsentVariant): string {
  switch (variant) {
    case "default":
      return "Default — full card with header and Learn more";
    case "small":
      return "Small — compact card with rounded buttons";
    case "mini":
      return "Mini — slim strip with inline buttons";
  }
}
