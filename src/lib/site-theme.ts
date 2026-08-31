import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { HOMEPAGE_CACHE_TAG, HOMEPAGE_REVALIDATE_SECONDS } from "@/lib/homepage-cache";
import { SITE_SETTING_ID } from "@/lib/theme";
import {
  DEFAULT_COOKIE_CONSENT_VARIANT,
  parseCookieConsentVariant,
  type CookieConsentVariant,
} from "@/lib/cookie-consent-variant";
import {
  DEFAULT_FACEBOOK_GROUP_URL,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_TAGLINE,
} from "@/lib/site-branding";
import { DEFAULT_FAQ_SECTION_INTRO, DEFAULT_FAQ_SECTION_TITLE } from "@/lib/faqs";

export type SiteTheme = {
  carouselEnabled: boolean;
  scrollToTopEnabled: boolean;
  cookieConsentVariant: CookieConsentVariant;
  siteName: string;
  siteTagline: string;
  facebookGroupUrl: string;
  testimonialsEnabled: boolean;
  faqsEnabled: boolean;
  faqSectionTitle: string;
  faqSectionIntro: string;
  howWalksWorkEnabled: boolean;
};

function defaultTheme(): SiteTheme {
  return {
    carouselEnabled: true,
    scrollToTopEnabled: true,
    cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
    siteName: DEFAULT_SITE_NAME,
    siteTagline: DEFAULT_SITE_TAGLINE,
    facebookGroupUrl: DEFAULT_FACEBOOK_GROUP_URL,
    testimonialsEnabled: true,
    faqsEnabled: true,
    faqSectionTitle: DEFAULT_FAQ_SECTION_TITLE,
    faqSectionIntro: DEFAULT_FAQ_SECTION_INTRO,
    howWalksWorkEnabled: true,
  };
}

async function loadSiteTheme(): Promise<SiteTheme> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: {
      carouselEnabled: true,
      scrollToTopEnabled: true,
      cookieConsentVariant: true,
      siteName: true,
      siteTagline: true,
      facebookGroupUrl: true,
      testimonialsEnabled: true,
      faqsEnabled: true,
      faqSectionTitle: true,
      faqSectionIntro: true,
      howWalksWorkEnabled: true,
    },
  });
  return {
    carouselEnabled: row?.carouselEnabled ?? true,
    scrollToTopEnabled: row?.scrollToTopEnabled ?? true,
    cookieConsentVariant:
      parseCookieConsentVariant(row?.cookieConsentVariant ?? "") ??
      DEFAULT_COOKIE_CONSENT_VARIANT,
    siteName: row?.siteName?.trim() || DEFAULT_SITE_NAME,
    siteTagline: row?.siteTagline?.trim() || DEFAULT_SITE_TAGLINE,
    facebookGroupUrl: row?.facebookGroupUrl ?? DEFAULT_FACEBOOK_GROUP_URL,
    testimonialsEnabled: row?.testimonialsEnabled ?? true,
    faqsEnabled: row?.faqsEnabled ?? true,
    faqSectionTitle: row?.faqSectionTitle?.trim() || DEFAULT_FAQ_SECTION_TITLE,
    faqSectionIntro: row?.faqSectionIntro?.trim() || DEFAULT_FAQ_SECTION_INTRO,
    howWalksWorkEnabled: row?.howWalksWorkEnabled ?? true,
  };
}

const getCachedSiteTheme = unstable_cache(loadSiteTheme, ["site-theme", "v5"], {
  tags: [HOMEPAGE_CACHE_TAG],
  revalidate: HOMEPAGE_REVALIDATE_SECONDS,
});

export const getSiteTheme = cache(async (): Promise<SiteTheme> => {
  try {
    return await getCachedSiteTheme();
  } catch {
    return defaultTheme();
  }
});
