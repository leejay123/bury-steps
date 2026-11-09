"use client";

import type { Config } from "@puckeditor/core";
import type { SitePageKey } from "@/lib/site-page-designs";
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
  WalkEssentialsListBlock,
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
/** An on/off switch (saved as "on" / "off"). */
const onOff = (label: string, onLabel = "Show", offLabel = "Hide") => ({
  type: "radio" as const,
  label,
  options: [
    { label: onLabel, value: "on" },
    { label: offLabel, value: "off" },
  ],
});
/** The strip a Read more / Show more sits in: white or light grey. */
const stripField = (label = "Read more strip") => ({
  type: "radio" as const,
  label,
  options: [
    { label: "White", value: "white" },
    { label: "Grey", value: "grey" },
  ],
});

/** The settings without those in `drop` (they belong to another look). */
function dropFields<F extends Record<string, unknown>>(fields: F, drop: string[]): F {
  return Object.fromEntries(Object.entries(fields).filter(([key]) => !drop.includes(key))) as F;
}

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
        look: {
          type: "select",
          label: "Look",
          options: [
            { value: "original", label: "Original (centred, Read more)" },
            { value: "split", label: "Story beside the heading" },
            { value: "words", label: "Story with its three words" },
          ],
        },
        title: text("Heading"),
        teaser: area("Short story"),
        readMore: onOff("Read more button"),
        showWords: onOff("The three words"),
        words: text("The three words (split with ·)"),
        moreStrip: stripField("Read the full story strip"),
      },
      // The three words only with the looks that show them.
      resolveFields: (data: { props: Record<string, unknown> }, { fields }: { fields: Record<string, unknown> }) => {
        const look = String(data.props.look ?? "original");
        const drop: string[] = [];
        if (look === "original") drop.push("showWords", "words");
        else if (data.props.showWords === "off") drop.push("words");
        // Only Story beside the heading has a strip (the others' Read more is a round button).
        if (look !== "split" || data.props.readMore === "off") drop.push("moreStrip");
        return dropFields(fields, drop);
      },
      render: HomeAboutBlock,
    },
    HomeWalks: {
      label: "Walks coming up",
      permissions: keep,
      fields: {
        look: {
          type: "select",
          label: "Look",
          options: [
            { value: "original", label: "Original (cards)" },
            { value: "rows", label: "Date rows" },
            { value: "next", label: "Next walk big, the rest beside" },
            { value: "week", label: "By date, in columns" },
          ],
        },
        moreStrip: stripField(),
        title: text("Heading"),
        rest: area("Line under the heading (the walk count stays automatic)"),
      },
      // The next-walk look shows four walks, no Read more strip.
      resolveFields: (data: { props: Record<string, unknown> }, { fields }: { fields: Record<string, unknown> }) =>
        data.props.look === "next" || data.props.look === "week" ? dropFields(fields, ["moreStrip"]) : fields,
      render: HomeWalksBlock,
    },
    HomeExpect: {
      label: "What you can expect",
      permissions: keep,
      fields: {
        look: {
          type: "select",
          label: "Look",
          options: [
            { value: "original", label: "Original (cards)" },
            { value: "ticks", label: "Ticked list in two columns" },
            { value: "numbered", label: "Heading beside a numbered list" },
            { value: "cells", label: "Icon cells" },
          ],
        },
        moreStrip: stripField(),
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
        moreStrip: stripField(),
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
        moreStrip: stripField(),
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
        look: {
          type: "select",
          label: "Look",
          options: [
            { value: "original", label: "Original (grid of three)" },
            { value: "carousel", label: "One big quote at a time" },
            { value: "rows", label: "Quote rows" },
            { value: "featured", label: "One featured, two beside" },
          ],
        },
        readMore: onOff("Read more button"),
        first: {
          type: "select",
          label: "How many show before Read more",
          options: [
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "6", label: "6" },
          ],
        },
        photos: onOff("Photos (or first letters)"),
        roles: onOff("The line under each name"),
        autoplay: onOff("Moves on by itself", "On", "Off"),
        moreStrip: stripField(),
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
      // Only the switches that apply to the chosen look.
      resolveFields: (data: { props: Record<string, unknown> }, { fields }: { fields: Record<string, unknown> }) => {
        const look = String(data.props.look ?? "original");
        const drop: string[] = [];
        if (look !== "carousel") drop.push("autoplay");
        if (look === "carousel") drop.push("readMore", "first");
        // The original always starts with three; the featured look with its three.
        if (look === "original" || look === "featured") drop.push("first");
        if (look === "original") drop.push("photos", "roles");
        if (data.props.readMore === "off") drop.push("first");
        if (look === "carousel" || data.props.readMore === "off") drop.push("moreStrip");
        return dropFields(fields, drop);
      },
      render: HomeReviewsBlock,
    },
    HomeFaq: {
      label: "Questions",
      permissions: keep,
      fields: {
        look: {
          type: "select",
          label: "Look",
          options: [
            { value: "original", label: "Original (topics down the side)" },
            { value: "search", label: "Search and topics" },
            { value: "grouped", label: "Grouped by topic" },
            { value: "cards", label: "Answer cards (answers always showing)" },
          ],
        },
        showMore: onOff("Show more button (Search and topics)", "On", "Off"),
        searchBar: stripField("Search bar"),
        openQuestion: {
          type: "radio",
          label: "Opened question",
          options: [
            { label: "Grey", value: "grey" },
            { label: "White", value: "white" },
          ],
        },
        moreStrip: stripField("Show more strip"),
        showMoreFirst: {
          type: "select",
          label: "How many questions before Show more",
          options: [
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5" },
            { value: "6", label: "6" },
            { value: "8", label: "8" },
          ],
        },
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
      // Show more is for the Search and topics look; its count only once it's on.
      resolveFields: (data: { props: Record<string, unknown> }, { fields }: { fields: Record<string, unknown> }) => {
        const look = String(data.props.look ?? "original");
        const drop: string[] = [];
        if (look !== "search") drop.push("showMore", "showMoreFirst", "moreStrip", "searchBar");
        else if (data.props.showMore !== "on") drop.push("showMoreFirst", "moreStrip");
        // Opened questions only in the looks whose questions open (not the original or the cards).
        if (look !== "search" && look !== "grouped") drop.push("openQuestion");
        return dropFields(fields, drop);
      },
      render: HomeFaqBlock,
    },
    HomeCta: {
      label: "Come for a walk",
      permissions: keep,
      fields: {
        look: {
          type: "select",
          label: "Look",
          options: [
            { value: "original", label: "Original (centred)" },
            { value: "split", label: "Words beside the buttons" },
            { value: "band", label: "Dark band" },
            { value: "next", label: "With the next walk" },
          ],
        },
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
      components: ["LegalHero", "LegalSection", "WalkEssentialsList", "LegalClosing"],
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
            { label: "How it works", value: "how" },
            { label: "What to expect", value: "expect" },
            { label: "Group rules", value: "rules" },
            { label: "Walk essentials", value: "essentials" },
          ],
        },
        docs: {
          type: "select",
          label: "Related pages under the heading",
          options: [
            { label: "About, Terms, Privacy, Contact", value: "legal" },
            { label: "How it works, What to expect, Group rules, Walk essentials", value: "guide" },
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
    WalkEssentialsList: {
      label: "Walk essentials list",
      permissions: keep,
      fields: {
        title: text("Heading"),
        after: area("Line under the list"),
      },
      render: WalkEssentialsListBlock,
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

export function configForPage(page: SitePageKey): Config {
  if (page === "home") return homePageConfig;
  if (page === "contact") return contactPageConfig;
  if (page === "apps") return appsPageConfig;
  return legalPageConfig;
}
