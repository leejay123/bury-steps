import { getShadcnHomeData } from "@/components/shadcnio/home-data";
import { siteChrome } from "@/components/shadcnio/chrome";
import { getHomepageFaqData } from "@/lib/homepage-faqs";
import { getHomepageTestimonials } from "@/lib/homepage-testimonials";
import { getInlineLogo } from "@/lib/inline-logo";
import { getSiteTheme } from "@/lib/site-theme";
import type { SitePageLive } from "@/components/site-page-designer/live";
import {
  editorDesign,
  type PuckData,
  type SitePageDesigns,
  type SitePageKey,
} from "./site-page-designs";
import {
  seedAboutDesign,
  seedAppsDesign,
  seedContactDesign,
  seedHomeDesign,
  seedPrivacyDesign,
  seedTermsDesign,
} from "./site-page-copy";

export async function seedForPage(page: SitePageKey): Promise<PuckData> {
  if (page === "home") {
    const [theme, testimonials, faqData] = await Promise.all([
      getSiteTheme(),
      getHomepageTestimonials(),
      getHomepageFaqData(),
    ]);
    return seedHomeDesign({
      aboutTitle: theme.howThisStartedTitle,
      aboutTeaser: theme.howThisStartedTeaser,
      expect: theme.aboutExpect.slice(0, 6),
      goals: theme.aboutGoals.slice(0, 6),
      quotes: testimonials.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        quote: row.quote,
      })),
      faqCategories: faqData.categories.map((row) => ({ id: row.id, label: row.label })),
      faqs: faqData.faqs.map((row) => ({
        id: row.id,
        categoryId: row.categoryId,
        question: row.question,
        answer: row.answer,
      })),
    });
  }
  if (page === "about") {
    const theme = await getSiteTheme();
    return seedAboutDesign({
      title: theme.howThisStartedTitle || "About",
      lead: "How Bury Steps began,",
      rest: "what to expect on a walk, and the simple rules that keep the group kind.",
      storyTitle: theme.howThisStartedTitle,
      storyBody: theme.howThisStartedBody,
      goalsHeading: theme.aboutGoalsHeading,
      goals: theme.aboutGoals,
      placesHeading: theme.aboutPlacesHeading,
      places: theme.aboutPlaces,
      expectHeading: theme.aboutExpectHeading,
      expect: theme.aboutExpect,
      rulesHeading: theme.aboutRulesHeading,
      rules: theme.aboutRules,
      facebookUrl: theme.facebookGroupUrl,
    });
  }
  if (page === "contact") return seedContactDesign();
  if (page === "privacy") return seedPrivacyDesign();
  if (page === "terms") return seedTermsDesign();
  return seedAppsDesign();
}

export async function loadSitePageLive(): Promise<SitePageLive> {
  const [data, logo, theme] = await Promise.all([getShadcnHomeData(), getInlineLogo(), getSiteTheme()]);
  const chrome = siteChrome(theme);
  return {
    data,
    logo: { src: logo.src, width: logo.width, height: logo.height },
    joinHref: chrome.joinHref,
    facebookUrl: chrome.facebookUrl,
  };
}

export async function editorDataForPages(designs: SitePageDesigns): Promise<Record<SitePageKey, PuckData>> {
  const keys: SitePageKey[] = ["home", "about", "contact", "privacy", "terms", "apps"];
  const seeds = await Promise.all(keys.map((key) => seedForPage(key)));
  return Object.fromEntries(
    keys.map((key, i) => [key, editorDesign(designs[key], seeds[i]!)]),
  ) as Record<SitePageKey, PuckData>;
}
