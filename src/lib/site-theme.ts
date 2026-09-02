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
import {
  DEFAULT_TESTIMONIALS_SECTION_INTRO,
  DEFAULT_TESTIMONIALS_SECTION_TITLE,
} from "@/lib/testimonials";
import {
  normalizeHomepageSectionOrder,
  type HomepageSectionId,
} from "@/lib/homepage-sections";
import {
  DEFAULT_ABOUT_EXPECT,
  DEFAULT_ABOUT_EXPECT_TEXT,
  DEFAULT_ABOUT_GOALS,
  DEFAULT_ABOUT_GOALS_TEXT,
  DEFAULT_ABOUT_PLACES,
  DEFAULT_ABOUT_PLACES_TEXT,
  DEFAULT_ABOUT_RULES_TEXT,
  DEFAULT_HOW_THIS_STARTED_BODY,
  DEFAULT_HOW_THIS_STARTED_EYEBROW,
  DEFAULT_HOW_THIS_STARTED_TEASER,
  DEFAULT_HOW_THIS_STARTED_TITLE,
  aboutListFromStored,
  aboutRulesFromStored,
  serializeAboutList,
  serializeAboutRules,
  type AboutRule,
} from "@/lib/homepage-copy";

export type SiteTheme = {
  carouselEnabled: boolean;
  scrollToTopEnabled: boolean;
  cookieConsentVariant: CookieConsentVariant;
  siteName: string;
  siteTagline: string;
  facebookGroupUrl: string;
  /** Empty hides the eyebrow — unlike the title/intro, blank is a valid value here, not "unset". */
  testimonialsSectionEyebrow: string;
  testimonialsSectionTitle: string;
  testimonialsSectionIntro: string;
  faqSectionTitle: string;
  faqSectionIntro: string;
  howThisStartedTitle: string;
  howThisStartedEyebrow: string;
  howThisStartedTeaser: string;
  howThisStartedBody: string;
  aboutGoals: string[];
  aboutPlaces: string[];
  aboutExpect: string[];
  aboutRules: AboutRule[];
  /** Raw textarea values for Display forms. */
  aboutGoalsText: string;
  aboutPlacesText: string;
  aboutExpectText: string;
  aboutRulesText: string;
  homepageSectionOrder: HomepageSectionId[];
  /** Bundled default, or `/api/site-logo?v=...` once an admin has uploaded one. */
  logoSrc: string;
  hasCustomLogo: boolean;
  /** Bundled default, or `/icon.png?v=...` once an admin has uploaded one — for the settings preview only; the actual `<link rel="icon">` always points at `/icon.png`. */
  faviconSrc: string;
  hasCustomFavicon: boolean;
};

const DEFAULT_LOGO_SRC = "/bury-steps-logo.png";
const DEFAULT_FAVICON_SRC = "/default-favicon.png";

function defaultTheme(): SiteTheme {
  return {
    carouselEnabled: true,
    scrollToTopEnabled: true,
    cookieConsentVariant: DEFAULT_COOKIE_CONSENT_VARIANT,
    siteName: DEFAULT_SITE_NAME,
    siteTagline: DEFAULT_SITE_TAGLINE,
    facebookGroupUrl: DEFAULT_FACEBOOK_GROUP_URL,
    testimonialsSectionEyebrow: "",
    testimonialsSectionTitle: DEFAULT_TESTIMONIALS_SECTION_TITLE,
    testimonialsSectionIntro: DEFAULT_TESTIMONIALS_SECTION_INTRO,
    faqSectionTitle: DEFAULT_FAQ_SECTION_TITLE,
    faqSectionIntro: DEFAULT_FAQ_SECTION_INTRO,
    howThisStartedTitle: DEFAULT_HOW_THIS_STARTED_TITLE,
    howThisStartedEyebrow: DEFAULT_HOW_THIS_STARTED_EYEBROW,
    howThisStartedTeaser: DEFAULT_HOW_THIS_STARTED_TEASER,
    howThisStartedBody: DEFAULT_HOW_THIS_STARTED_BODY,
    aboutGoals: [...DEFAULT_ABOUT_GOALS],
    aboutPlaces: [...DEFAULT_ABOUT_PLACES],
    aboutExpect: [...DEFAULT_ABOUT_EXPECT],
    aboutRules: aboutRulesFromStored(""),
    aboutGoalsText: DEFAULT_ABOUT_GOALS_TEXT,
    aboutPlacesText: DEFAULT_ABOUT_PLACES_TEXT,
    aboutExpectText: DEFAULT_ABOUT_EXPECT_TEXT,
    aboutRulesText: DEFAULT_ABOUT_RULES_TEXT,
    homepageSectionOrder: normalizeHomepageSectionOrder(null),
    logoSrc: DEFAULT_LOGO_SRC,
    hasCustomLogo: false,
    faviconSrc: DEFAULT_FAVICON_SRC,
    hasCustomFavicon: false,
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
      testimonialsSectionEyebrow: true,
      testimonialsSectionTitle: true,
      testimonialsSectionIntro: true,
      faqSectionTitle: true,
      faqSectionIntro: true,
      howThisStartedTitle: true,
      howThisStartedEyebrow: true,
      howThisStartedTeaser: true,
      howThisStartedBody: true,
      aboutGoals: true,
      aboutPlaces: true,
      aboutExpect: true,
      aboutRules: true,
      homepageSectionOrder: true,
      logoMime: true,
      faviconMime: true,
      updatedAt: true,
    },
  });

  const aboutGoals = aboutListFromStored(row?.aboutGoals, DEFAULT_ABOUT_GOALS);
  const aboutPlaces = aboutListFromStored(row?.aboutPlaces, DEFAULT_ABOUT_PLACES);
  const aboutExpect = aboutListFromStored(row?.aboutExpect, DEFAULT_ABOUT_EXPECT);
  const aboutRules = aboutRulesFromStored(row?.aboutRules);

  return {
    carouselEnabled: row?.carouselEnabled ?? true,
    scrollToTopEnabled: row?.scrollToTopEnabled ?? true,
    cookieConsentVariant:
      parseCookieConsentVariant(row?.cookieConsentVariant ?? "") ??
      DEFAULT_COOKIE_CONSENT_VARIANT,
    siteName: row?.siteName?.trim() || DEFAULT_SITE_NAME,
    siteTagline: row?.siteTagline?.trim() || DEFAULT_SITE_TAGLINE,
    facebookGroupUrl: row?.facebookGroupUrl ?? DEFAULT_FACEBOOK_GROUP_URL,
    testimonialsSectionEyebrow: row?.testimonialsSectionEyebrow?.trim() ?? "",
    testimonialsSectionTitle:
      row?.testimonialsSectionTitle?.trim() || DEFAULT_TESTIMONIALS_SECTION_TITLE,
    testimonialsSectionIntro:
      row?.testimonialsSectionIntro?.trim() || DEFAULT_TESTIMONIALS_SECTION_INTRO,
    faqSectionTitle: row?.faqSectionTitle?.trim() || DEFAULT_FAQ_SECTION_TITLE,
    faqSectionIntro: row?.faqSectionIntro?.trim() || DEFAULT_FAQ_SECTION_INTRO,
    howThisStartedTitle: row?.howThisStartedTitle?.trim() || DEFAULT_HOW_THIS_STARTED_TITLE,
    howThisStartedEyebrow:
      row?.howThisStartedEyebrow?.trim() || DEFAULT_HOW_THIS_STARTED_EYEBROW,
    howThisStartedTeaser:
      row?.howThisStartedTeaser?.trim() || DEFAULT_HOW_THIS_STARTED_TEASER,
    howThisStartedBody: row?.howThisStartedBody?.trim() || DEFAULT_HOW_THIS_STARTED_BODY,
    aboutGoals,
    aboutPlaces,
    aboutExpect,
    aboutRules,
    aboutGoalsText: row?.aboutGoals?.trim()
      ? serializeAboutList(aboutGoals)
      : DEFAULT_ABOUT_GOALS_TEXT,
    aboutPlacesText: row?.aboutPlaces?.trim()
      ? serializeAboutList(aboutPlaces)
      : DEFAULT_ABOUT_PLACES_TEXT,
    aboutExpectText: row?.aboutExpect?.trim()
      ? serializeAboutList(aboutExpect)
      : DEFAULT_ABOUT_EXPECT_TEXT,
    aboutRulesText: row?.aboutRules?.trim()
      ? serializeAboutRules(aboutRules)
      : DEFAULT_ABOUT_RULES_TEXT,
    homepageSectionOrder: normalizeHomepageSectionOrder(row?.homepageSectionOrder),
    logoSrc: row?.logoMime
      ? `/api/site-logo?v=${row.updatedAt.getTime()}`
      : DEFAULT_LOGO_SRC,
    hasCustomLogo: Boolean(row?.logoMime),
    faviconSrc: row?.faviconMime
      ? `/icon.png?v=${row.updatedAt.getTime()}`
      : DEFAULT_FAVICON_SRC,
    hasCustomFavicon: Boolean(row?.faviconMime),
  };
}

const getCachedSiteTheme = unstable_cache(loadSiteTheme, ["site-theme", "v11"], {
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
