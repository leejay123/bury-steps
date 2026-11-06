"use client";

import type { Config } from "@puckeditor/core";
import {
  AppsCardBlock,
  AppsHeroBlock,
  ContactFormBlock,
  ContactHeroBlock,
  HomeAboutBlock,
  HomeCtaBlock,
  HomeExpectBlock,
  HomeFaqBlock,
  HomeGoalsBlock,
  HomeHeroBlock,
  HomeHowItWorksBlock,
  HomeReviewsBlock,
  HomeWalksBlock,
  LegalClosingBlock,
  LegalHeroBlock,
  LegalSectionBlock,
} from "./blocks";

const text = (label: string) => ({ type: "text" as const, label });
const area = (label: string) => ({ type: "textarea" as const, label });
const list = (label: string, title = "Title") => ({
  type: "array" as const,
  label,
  arrayFields: { title: text(title) },
  defaultItemProps: { title: "" },
  getItemSummary: (item: { title?: string }) => item.title || "Item",
});

const keep = { duplicate: false };

export const homePageConfig = {
  categories: {
    page: {
      title: "Homepage sections",
      components: [
        "HomeHero",
        "HomeAbout",
        "HomeWalks",
        "HomeExpect",
        "HomeHowItWorks",
        "HomeGoals",
        "HomeReviews",
        "HomeFaq",
        "HomeCta",
      ],
    },
  },
  components: {
    HomeHero: {
      label: "Hero",
      permissions: { ...keep, delete: false },
      fields: {
        kicker: text("Small line above the heading"),
        headingBefore: text("Heading before the logo"),
        headingWord: text("Word beside the logo"),
        headingAfter: text("Heading after the logo word"),
        headingRest: text("Second line of the heading"),
        guestClose: area("Line for visitors (signed out)"),
        memberClose: area("Line for members (signed in)"),
      },
      render: HomeHeroBlock,
    },
    HomeAbout: {
      label: "How this started",
      permissions: keep,
      fields: {
        title: text("Heading"),
        teaser: area("Short story"),
      },
      render: HomeAboutBlock,
    },
    HomeWalks: {
      label: "Walks coming up",
      permissions: keep,
      fields: {
        title: text("Heading"),
        rest: area("Line under the heading (the walk count stays automatic)"),
      },
      render: HomeWalksBlock,
    },
    HomeExpect: {
      label: "What you can expect",
      permissions: keep,
      fields: {
        title: text("Heading"),
        lead: text("Opening words"),
        rest: area("Rest of the intro"),
        items: list("Items"),
      },
      render: HomeExpectBlock,
    },
    HomeHowItWorks: {
      label: "How it works",
      permissions: keep,
      fields: {
        title: text("Heading"),
        lead: text("Opening words"),
        rest: area("Rest of the intro"),
        steps: {
          type: "array",
          label: "Steps",
          arrayFields: { title: text("Title"), sub: text("Short line") },
          defaultItemProps: { title: "", sub: "" },
          getItemSummary: (item: { title?: string }) => item.title || "Step",
        },
      },
      render: HomeHowItWorksBlock,
    },
    HomeGoals: {
      label: "More than just a walking group",
      permissions: keep,
      fields: {
        title: text("Heading"),
        lead: text("Opening words"),
        rest: area("Rest of the intro"),
        items: list("Goals"),
      },
      render: HomeGoalsBlock,
    },
    HomeReviews: {
      label: "Quotes",
      permissions: keep,
      fields: {
        title: text("Heading"),
        lead: text("Opening words"),
        rest: area("Rest of the intro"),
        quotes: {
          type: "array",
          label: "Quotes",
          arrayFields: {
            name: text("Name"),
            role: text("Line under the name"),
            quote: area("Quote"),
          },
          defaultItemProps: { name: "", role: "", quote: "" },
          getItemSummary: (item: { name?: string }) => item.name || "Quote",
        },
      },
      render: HomeReviewsBlock,
    },
    HomeFaq: {
      label: "Questions",
      permissions: keep,
      fields: {
        title: text("Heading"),
        lead: text("Opening words"),
        rest: area("Rest of the intro"),
        categories: {
          type: "array",
          label: "Topics",
          arrayFields: { id: text("Id"), label: text("Topic") },
          defaultItemProps: { id: "", label: "" },
          getItemSummary: (item: { label?: string }) => item.label || "Topic",
        },
        faqs: {
          type: "array",
          label: "Questions",
          arrayFields: {
            id: text("Id"),
            categoryId: text("Topic id"),
            question: text("Question"),
            answer: area("Answer"),
          },
          defaultItemProps: { id: "", categoryId: "", question: "", answer: "" },
          getItemSummary: (item: { question?: string }) => item.question || "Question",
        },
      },
      render: HomeFaqBlock,
    },
    HomeCta: {
      label: "Come for a walk",
      permissions: keep,
      fields: {
        title: text("Heading"),
        guestBody: area("Text for visitors"),
        memberBody: area("Text for members"),
      },
      render: HomeCtaBlock,
    },
  },
} as Config;

export const legalPageConfig = {
  categories: {
    page: {
      title: "Page sections",
      components: ["LegalHero", "LegalSection", "LegalClosing"],
    },
  },
  components: {
    LegalHero: {
      label: "Heading",
      permissions: keep,
      fields: {
        title: text("Title"),
        lead: text("Opening words"),
        rest: area("Rest of the intro"),
        updated: text("Last updated"),
        icon: {
          type: "select",
          label: "Page mark",
          options: [
            { label: "About", value: "about" },
            { label: "Privacy", value: "privacy" },
            { label: "Terms", value: "terms" },
          ],
        },
        current: text("This page's path"),
      },
      render: LegalHeroBlock,
    },
    LegalSection: {
      label: "Section",
      permissions: keep,
      fields: {
        title: text("Heading"),
        body: area("Body (blank line = new paragraph, start a line with - for a list, **bold**, [link](url))"),
      },
      render: LegalSectionBlock,
    },
    LegalClosing: {
      label: "Closing",
      permissions: keep,
      fields: { closing: area("Closing line") },
      render: LegalClosingBlock,
    },
  },
} as Config;

export const contactPageConfig = {
  categories: {
    page: {
      title: "Contact page",
      components: ["ContactHero", "ContactForm"],
    },
  },
  components: {
    ContactHero: {
      label: "Heading",
      permissions: keep,
      fields: {
        eyebrow: text("Small label"),
        title: text("Title"),
        intro: area("Intro"),
        showFacebook: {
          type: "radio",
          label: "Facebook button",
          options: [
            { label: "Show (uses the URL from Branding)", value: "show" },
            { label: "Hide", value: "hide" },
          ],
        },
      },
      render: ContactHeroBlock,
    },
    ContactForm: {
      label: "Message form",
      permissions: { ...keep, delete: false },
      fields: {
        steps: list("What happens next", "Step"),
      },
      render: ContactFormBlock,
    },
  },
} as Config;

export const appsPageConfig = {
  categories: {
    page: {
      title: "Apps page",
      components: ["AppsHero", "AppsCard"],
    },
  },
  components: {
    AppsHero: {
      label: "Heading",
      permissions: keep,
      fields: {
        eyebrow: text("Small label"),
        title: text("Title"),
        intro: area("Intro"),
      },
      render: AppsHeroBlock,
    },
    AppsCard: {
      label: "App",
      permissions: keep,
      fields: {
        name: text("Name"),
        tagline: text("Tagline"),
        description: area("Description"),
        uses: list("What it's for"),
        appStore: text("App Store link"),
        googlePlay: text("Google Play link"),
      },
      render: AppsCardBlock,
    },
  },
} as Config;

export function configForPage(page: "home" | "about" | "contact" | "privacy" | "terms" | "apps"): Config {
  if (page === "home") return homePageConfig;
  if (page === "contact") return contactPageConfig;
  if (page === "apps") return appsPageConfig;
  return legalPageConfig;
}
