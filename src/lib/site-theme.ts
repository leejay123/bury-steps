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
  DEFAULT_HERO_STYLE,
  DEFAULT_HERO_VIDEO_KEY,
  parseHeroStyle,
  parseHeroVideoKey,
  type HeroStyle,
} from "@/lib/hero-style";
import {
  DEFAULT_ABOUT_EXPECT,
  DEFAULT_ABOUT_EXPECT_HEADING,
  DEFAULT_ABOUT_EXPECT_TEXT,
  DEFAULT_ABOUT_GOALS,
  DEFAULT_ABOUT_GOALS_HEADING,
  DEFAULT_ABOUT_GOALS_TEXT,
  DEFAULT_ABOUT_PLACES,
  DEFAULT_ABOUT_PLACES_HEADING,
  DEFAULT_ABOUT_PLACES_TEXT,
  DEFAULT_ABOUT_RULES_HEADING,
  DEFAULT_ABOUT_RULES_TEXT,
  DEFAULT_HOW_THIS_STARTED_BODY,
  DEFAULT_HOW_THIS_STARTED_EYEBROW,
  DEFAULT_HOW_THIS_STARTED_TEASER,
  DEFAULT_HOW_THIS_STARTED_TITLE,
  DEFAULT_BEFORE_YOU_SET_OFF_TIPS,
  DEFAULT_BEFORE_YOU_SET_OFF_TIPS_TEXT,
  DEFAULT_HOW_WALKS_WORK_STEPS,
  DEFAULT_HOW_WALKS_WORK_STEPS_TEXT,
  aboutListFromStored,
  aboutRulesFromStored,
  beforeYouSetOffTipsFromStored,
  howWalksWorkStepsFromStored,
  serializeAboutList,
  serializeAboutRules,
  type AboutRule,
} from "@/lib/homepage-copy";

export type SiteTheme = {
  heroStyle: HeroStyle;
  heroVideoKey: string;
  carouselEnabled: boolean;
  /** Site-wide switch for the homepage's "Latest notices" section (see
   * updateMemberNoticesEnabled) — off hides it even when there are notices
   * a signed-in member would otherwise see there. */
  memberNoticesEnabled: boolean;
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
  /** Real, visible About-drawer section headings (distinct from the admin-only Goals/Places/etc. labels). */
  aboutGoalsHeading: string;
  aboutPlacesHeading: string;
  aboutExpectHeading: string;
  aboutRulesHeading: string;
  /** Walk-page cards. */
  beforeYouSetOffTips: string[];
  beforeYouSetOffTipsText: string;
  howWalksWorkSteps: AboutRule[];
  howWalksWorkStepsText: string;
  homepageSectionOrder: HomepageSectionId[];
  /** Bundled default, or `/api/site-logo?v=...` once an admin has uploaded one. */
  logoSrc: string;
  hasCustomLogo: boolean;
  /** Bundled default, or `/icon.png?v=...` once an admin has uploaded one — for the settings preview only; the actual `<link rel="icon">` always points at `/icon.png`. */
  faviconSrc: string;
  hasCustomFavicon: boolean;
  /** Letterhead-style banner for printed accident reports. No bundled default — null hides it entirely. */
  reportBannerSrc: string | null;
};

const DEFAULT_LOGO_SRC = "/bury-steps-logo.png";
const DEFAULT_FAVICON_SRC = "/default-favicon.png";

function defaultTheme(): SiteTheme {
  return {
    heroStyle: DEFAULT_HERO_STYLE,
    heroVideoKey: DEFAULT_HERO_VIDEO_KEY,
    carouselEnabled: true,
    memberNoticesEnabled: true,
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
    aboutGoalsHeading: DEFAULT_ABOUT_GOALS_HEADING,
    aboutPlacesHeading: DEFAULT_ABOUT_PLACES_HEADING,
    aboutExpectHeading: DEFAULT_ABOUT_EXPECT_HEADING,
    aboutRulesHeading: DEFAULT_ABOUT_RULES_HEADING,
    beforeYouSetOffTips: [...DEFAULT_BEFORE_YOU_SET_OFF_TIPS],
    beforeYouSetOffTipsText: DEFAULT_BEFORE_YOU_SET_OFF_TIPS_TEXT,
    howWalksWorkSteps: DEFAULT_HOW_WALKS_WORK_STEPS.map((step) => ({ ...step })),
    howWalksWorkStepsText: DEFAULT_HOW_WALKS_WORK_STEPS_TEXT,
    homepageSectionOrder: normalizeHomepageSectionOrder(null),
    logoSrc: DEFAULT_LOGO_SRC,
    hasCustomLogo: false,
    faviconSrc: DEFAULT_FAVICON_SRC,
    hasCustomFavicon: false,
    reportBannerSrc: null,
  };
}

async function loadSiteTheme(): Promise<SiteTheme> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_ID },
    select: {
      heroStyle: true,
      heroVideoKey: true,
      carouselEnabled: true,
      memberNoticesEnabled: true,
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
      aboutGoalsHeading: true,
      aboutPlacesHeading: true,
      aboutExpectHeading: true,
      aboutRulesHeading: true,
      beforeYouSetOffTips: true,
      howWalksWorkSteps: true,
      homepageSectionOrder: true,
      logoMime: true,
      faviconMime: true,
      reportBannerMime: true,
      updatedAt: true,
    },
  });

  const aboutGoals = aboutListFromStored(row?.aboutGoals, DEFAULT_ABOUT_GOALS);
  const aboutPlaces = aboutListFromStored(row?.aboutPlaces, DEFAULT_ABOUT_PLACES);
  const aboutExpect = aboutListFromStored(row?.aboutExpect, DEFAULT_ABOUT_EXPECT);
  const aboutRules = aboutRulesFromStored(row?.aboutRules);
  const beforeYouSetOffTips = beforeYouSetOffTipsFromStored(row?.beforeYouSetOffTips);
  const howWalksWorkSteps = howWalksWorkStepsFromStored(row?.howWalksWorkSteps);

  return {
    heroStyle: parseHeroStyle(row?.heroStyle),
    heroVideoKey: parseHeroVideoKey(row?.heroVideoKey),
    carouselEnabled: row?.carouselEnabled ?? true,
    memberNoticesEnabled: row?.memberNoticesEnabled ?? true,
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
    aboutGoalsHeading: row?.aboutGoalsHeading?.trim() || DEFAULT_ABOUT_GOALS_HEADING,
    aboutPlacesHeading: row?.aboutPlacesHeading?.trim() || DEFAULT_ABOUT_PLACES_HEADING,
    aboutExpectHeading: row?.aboutExpectHeading?.trim() || DEFAULT_ABOUT_EXPECT_HEADING,
    aboutRulesHeading: row?.aboutRulesHeading?.trim() || DEFAULT_ABOUT_RULES_HEADING,
    beforeYouSetOffTips,
    beforeYouSetOffTipsText: row?.beforeYouSetOffTips?.trim()
      ? serializeAboutList(beforeYouSetOffTips)
      : DEFAULT_BEFORE_YOU_SET_OFF_TIPS_TEXT,
    howWalksWorkSteps,
    howWalksWorkStepsText: row?.howWalksWorkSteps?.trim()
      ? serializeAboutRules(howWalksWorkSteps)
      : DEFAULT_HOW_WALKS_WORK_STEPS_TEXT,
    homepageSectionOrder: normalizeHomepageSectionOrder(row?.homepageSectionOrder),
    logoSrc: row?.logoMime
      ? `/api/site-logo?v=${row.updatedAt.getTime()}`
      : DEFAULT_LOGO_SRC,
    hasCustomLogo: Boolean(row?.logoMime),
    faviconSrc: row?.faviconMime
      ? `/icon.png?v=${row.updatedAt.getTime()}`
      : DEFAULT_FAVICON_SRC,
    hasCustomFavicon: Boolean(row?.faviconMime),
    reportBannerSrc: row?.reportBannerMime
      ? `/api/report-banner?v=${row.updatedAt.getTime()}`
      : null,
  };
}

const getCachedSiteTheme = unstable_cache(loadSiteTheme, ["site-theme", "v16"], {
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
