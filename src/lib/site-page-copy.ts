import { DEFAULT_FAQ_CATEGORIES } from "@/lib/faqs";
import {
  DEFAULT_ABOUT_EXPECT,
  DEFAULT_ABOUT_GOALS,
  DEFAULT_ABOUT_PLACES,
  DEFAULT_ABOUT_RULES_HEADING,
  DEFAULT_HOW_THIS_STARTED_BODY,
  DEFAULT_HOW_THIS_STARTED_TEASER,
  DEFAULT_HOW_THIS_STARTED_TITLE,
} from "@/lib/homepage-copy";
import { DEFAULT_FAQS, DEFAULT_TESTIMONIALS } from "@/lib/site-defaults";
import { puckBlock, puckPage, type PuckBlock, type PuckData } from "./site-page-designs";

const LEGAL_UPDATED = "28 August 2026";

export const HOME_HOW_IT_WORKS_STEPS = [
  { title: "Create an account", sub: "Email or Google, one minute" },
  { title: "See the walks", sub: "Time, meeting point and map" },
  { title: "Clock in on the day", sub: "So the leader knows you're there" },
  { title: "Walk at your pace", sub: "Nobody gets left behind" },
  { title: "Clock out when done", sub: "Leaving early is fine" },
  { title: "Read the notices", sub: "News from the organisers" },
] as const;

export const CONTACT_FORM_STEPS = [
  "Tell us who you are, so we know who to reply to.",
  "Ask anything: joining, a walk, or something else.",
  "An organiser reads it and gets back to you, usually within a few days.",
] as const;

export type QuoteSeed = { id: string; name: string; role: string; quote: string };
export type FaqSeed = { id: string; categoryId: string; question: string; answer: string };
export type FaqCategorySeed = { id: string; label: string };
export type RuleSeed = { title: string; body: string };

export type HomeSeedInput = {
  aboutTitle: string;
  aboutTeaser: string;
  expect: string[];
  goals: string[];
  quotes: QuoteSeed[];
  faqCategories: FaqCategorySeed[];
  faqs: FaqSeed[];
};

export type AboutSeedInput = {
  title: string;
  lead: string;
  rest: string;
  storyTitle: string;
  storyBody: string;
  goalsHeading: string;
  goals: string[];
  placesHeading: string;
  places: string[];
  expectHeading: string;
  expect: string[];
  rulesHeading: string;
  rules: RuleSeed[];
  facebookUrl: string;
};

export function defaultHomeSeed(): HomeSeedInput {
  return {
    aboutTitle: DEFAULT_HOW_THIS_STARTED_TITLE,
    aboutTeaser: DEFAULT_HOW_THIS_STARTED_TEASER,
    expect: [...DEFAULT_ABOUT_EXPECT].slice(0, 6),
    goals: [...DEFAULT_ABOUT_GOALS].slice(0, 6),
    quotes: DEFAULT_TESTIMONIALS.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      quote: row.quote,
    })),
    faqCategories: DEFAULT_FAQ_CATEGORIES.map((row) => ({ id: row.id, label: row.label })),
    faqs: DEFAULT_FAQS.map((row) => ({
      id: row.id,
      categoryId: row.categoryId,
      question: row.question,
      answer: row.answer,
    })),
  };
}

export function defaultHomeHero(): PuckBlock {
  return puckBlock("HomeHero", 1, {
    kicker: "Bury Steps is a free, friendly walking group from Bury",
    headingBefore: "The",
    headingWord: "walking",
    headingAfter: "group",
    headingRest: "all of Bury steps out with.",
    guestClose: "Join for free, and clock in on the day of the walk.",
    memberClose: "Pick your next walk, and clock in when you get there.",
  });
}

export function defaultContactForm(): PuckBlock {
  return puckBlock("ContactForm", 2, {
    steps: CONTACT_FORM_STEPS.map((title) => ({ title })),
  });
}

export function seedHomeDesign(input: HomeSeedInput): PuckData {
  return puckPage([
    defaultHomeHero(),
    puckBlock("HomeAbout", 2, { title: input.aboutTitle, teaser: input.aboutTeaser }),
    puckBlock("HomeWalks", 3, {
      title: "Walks coming up, every week",
      rest: "each one led by a volunteer walk leader, with the meeting point, distance and grade. Members see every detail and clock in on the day.",
    }),
    puckBlock("HomeExpect", 4, {
      title: "What you can expect",
      lead: "A friendly, welcoming group",
      rest: "for every age and every pace. No pressure, no judgement, just good company on the paths.",
      items: input.expect.map((title) => ({ title })),
    }),
    puckBlock("HomeHowItWorks", 5, {
      title: "How it works",
      lead: "Join, see the walks, clock in:",
      rest: "that's all there is to it. The leader knows who's out walking, and you can look back on every walk you've done.",
      steps: HOME_HOW_IT_WORKS_STEPS.map((step) => ({ title: step.title, sub: step.sub })),
    }),
    puckBlock("HomeGoals", 6, {
      title: "More than just a walking group",
      lead: "Fitter, happier and less alone,",
      rest: "at whatever pace suits you. Members walk to get moving again, to feel better and to make friends.",
      items: input.goals.map((title) => ({ title })),
    }),
    puckBlock("HomeReviews", 7, {
      title: "From the group",
      lead: "Members love walking with us.",
      rest: "Here's what a few of them say about the group, the walks and the people.",
      quotes: input.quotes,
    }),
    puckBlock("HomeFaq", 8, {
      title: "Frequently asked questions",
      lead: "How to join, what to bring and how clock-in works,",
      rest: "and anything else people ask. Still stuck? Ask in the Facebook group.",
      categories: input.faqCategories,
      faqs: input.faqs,
    }),
    puckBlock("HomeCta", 9, {
      title: "Come for a walk this week",
      guestBody: "Joining is free. Make an account, pick a walk and meet us there. Walk at your own pace; nobody gets left behind.",
      memberBody: "Your next walk is waiting. Pick one, meet us there and clock in on the day. Walk at your own pace; nobody gets left behind.",
    }),
  ]);
}

function paragraphs(text: string): string {
  return text.trim();
}

function list(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function rulesList(rules: RuleSeed[]): string {
  return rules.map((rule) => `- **${rule.title}.** ${rule.body}`).join("\n");
}

export function seedAboutDesign(input: AboutSeedInput): PuckData {
  const facebook = input.facebookUrl.trim()
    ? `[Facebook group](${input.facebookUrl.trim()})`
    : "Facebook group";
  return puckPage([
    puckBlock("LegalHero", 1, {
      title: input.title || "About",
      lead: input.lead,
      rest: input.rest,
      updated: LEGAL_UPDATED,
      icon: "about",
      current: "/about",
    }),
    puckBlock("LegalSection", 2, { title: input.storyTitle, body: paragraphs(input.storyBody) }),
    puckBlock("LegalSection", 3, {
      title: input.goalsHeading,
      body: [
        "Bury Steps was never created as a fitness club or a competition. There are no winners and losers here. Nobody cares how fast you walk, how far you walk, what fitness level you are at, or whether you are just starting out after years of inactivity.",
        "This group is about supporting each other, enjoying the outdoors, improving our physical and mental wellbeing, and proving that positive change often begins with one small step.",
        "Whether your goal is to:",
        list(input.goals),
        "…you will find a warm welcome here.",
      ].join("\n\n"),
    }),
    puckBlock("LegalSection", 4, {
      title: input.placesHeading,
      body: [
        "The idea is simple. We meet on Sunday afternoons and explore different walks suggested by members.",
        list(input.places),
        "Everyone is encouraged to share ideas and help shape the group. The walks belong to all of us, and every member has something valuable to contribute.",
      ].join("\n\n"),
    }),
    puckBlock("LegalSection", 5, {
      title: input.expectHeading,
      body: list(input.expect),
    }),
    puckBlock("LegalSection", 6, {
      title: "Taking the first step",
      body: [
        "Joining a new group can feel daunting. Many of us know what it is like to sit at home wondering whether to come along, worrying about whether we will fit in, keep up, or know anyone.",
        `You do not have to have it all figured out. Come as you are. Chat, photos and last-minute updates also live in our ${facebook}.`,
      ].join("\n\n"),
    }),
    puckBlock("LegalSection", 7, {
      title: input.rulesHeading || DEFAULT_ABOUT_RULES_HEADING,
      body: rulesList(input.rules),
    }),
    puckBlock("LegalClosing", 8, { closing: "Come for a walk — everyone is welcome." }),
  ]);
}

export function seedContactDesign(): PuckData {
  return puckPage([
    puckBlock("ContactHero", 1, {
      eyebrow: "Help",
      title: "Contact us",
      intro: "An organiser reads every message and gets back to you: joining, a walk, or anything else.",
      showFacebook: "show",
    }),
    defaultContactForm(),
  ]);
}

export function seedAppsDesign(): PuckData {
  return puckPage([
    puckBlock("AppsHero", 1, {
      eyebrow: "Free to download",
      title: "Apps for our walks",
      intro: "Two free apps that make walking with us easier. Download them before your first walk.",
    }),
    puckBlock("AppsCard", 2, {
      name: "what3words",
      tagline: "Find the exact meeting point",
      description:
        "Every walk's what3words address opens straight in the app, so you know precisely where to be — even in a car park or at a field gate.",
      uses: [
        { title: "Tap the what3words address on a walk page" },
        { title: "Get walking or driving directions to the spot" },
        { title: "Share your exact location if you need help on a walk" },
      ],
      appStore: "https://apps.apple.com/gb/app/what3words-navigation-maps/id657878530",
      googlePlay: "https://play.google.com/store/apps/details?id=com.what3words.android",
    }),
    puckBlock("AppsCard", 3, {
      name: "HiiKER",
      tagline: "Hiking maps for our routes",
      description:
        "See the trail, the distance and the hills before you set off, and follow the route on the day so you never lose the group.",
      uses: [
        { title: "Look at the route and the climbs before the walk" },
        { title: "Follow the path on your phone as you walk" },
        { title: "See where you are on the map using your phone's GPS" },
      ],
      appStore: "https://apps.apple.com/gb/app/hiiker-the-hiking-maps-app/id1470810597",
      googlePlay: "https://play.google.com/store/apps/details?id=com.waymarkedtrails.hiiker",
    }),
  ]);
}

export const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: "About this notice",
    body: [
      "Bury Steps Walking Group (“Bury Steps”, “we”) runs the website [burysteps-walkinggroup.co.uk](https://burysteps-walkinggroup.co.uk) so members can create an account, see upcoming walks, and clock in at a meeting point.",
      "We are based in the United Kingdom. This notice explains what we collect, why we collect it, and how long we keep it.",
    ].join("\n\n"),
  },
  {
    title: "Who we are",
    body: "Bury Steps is a local walking group, not a large company. Organisers of the group run this site. If you have a privacy question, contact an organiser through the website after you sign in, or ask the person who invited you to the group.",
  },
  {
    title: "What we collect",
    body: list([
      "Account details: name and email address, used to sign in and identify you.",
      "Sign-in data: if you sign in with Google or email, our login provider (Clerk) processes that request.",
      "Walk records: which walks you are listed on, when you clock in, and if you clock out.",
      "Optional health notes at clock-in: only if you choose to provide them, so a walk leader can help if you need it. You must tick a consent box before this is saved.",
      "Emergency contact: a name and phone number you can add when you clock in, so an organiser can call someone if you need help. An organiser can choose to make this required. It is saved on your account until you change it or your account is removed.",
    ]),
  },
  {
    title: "Why we use it",
    body: [
      "We use this information to:",
      list([
        "create and manage your member account;",
        "show you walks and let organisers run the group;",
        "record attendance when you clock in, and if you clock out;",
        "hold health notes you volunteer, for safety during that walk.",
        "reach someone you name if you need help on a walk.",
      ]),
      "We do not sell your information. We do not use it for advertising.",
    ].join("\n\n"),
  },
  {
    title: "Who else sees it",
    body: list([
      "**Clerk** provides sign-in and sign-up. Their privacy notice is on clerk.com.",
      "**Supabase** stores walk and member records in a database in the London region (United Kingdom).",
      "**Vercel** hosts the website and provides Vercel Analytics, which counts page views without cookies or a per-person ID.",
      "**OpenStreetMap** looks up the meeting point (and postcode, if the organiser added one) so the walk page can show a map, and names the town from the map pin on the forecast. Those lookups are the place name, postcode, or map location only, not your account. If you tap Get directions, Google Maps or Apple Maps opens with that place.",
      "**Google** if you choose “Sign in with Google”. Google’s terms and privacy policy then also apply to that sign-in.",
      "Walk organisers can see attendance, clock-out reasons, and the emergency contact you save. Site owners can also see any health notes you submit. Other members only see names of people still on the walk.",
      "**Open-Meteo** provides the weather forecast on a walk page. That request is the meeting point’s map location only, not your account.",
    ]),
  },
  {
    title: "How long we keep it",
    body: list([
      "Your account stays until you ask an organiser to delete it, or it is removed.",
      "Health notes are deleted automatically 90 days after the walk.",
      "Your emergency contact stays on your account until you change it at clock-in or your account is removed.",
      "Walk attendance may be kept for the running of the group.",
    ]),
  },
  {
    title: "Cookies",
    body: [
      "This site uses cookies that are needed for it to work. That includes cookies from our sign-in provider (Clerk) so we can keep you signed in, and a cookie that remembers whether you accepted or declined the cookie notice.",
      "We do not use cookies for advertising. We use Vercel Analytics to see how many people visit and which pages are popular — it counts page views without setting a cookie, without a persistent ID for your device, and without following you to other sites, so it works the same whichever you choose below.",
      "On a first visit you can Accept or Decline the notice; either choice is remembered for a year. Cookies that are needed to sign in are still used if you decline.",
    ].join("\n\n"),
  },
  {
    title: "Your rights",
    body: "Under UK data protection law you can ask to see the information we hold about you, ask us to correct it, or ask us to delete your account. Contact an organiser to do that.",
  },
  {
    title: "Children",
    body: "This site is for adult members of the walking group. It is not aimed at children.",
  },
];

export const TERMS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "The group and the website",
    body: [
      "These terms cover use of the Bury Steps Walking Group website at [burysteps-walkinggroup.co.uk](https://burysteps-walkinggroup.co.uk) and taking part in group walks organised through it.",
      "Bury Steps is a local walking group. The website helps members see upcoming walks and clock in when they arrive. Organisers create walks; owners also manage membership and site settings.",
    ].join("\n\n"),
  },
  {
    title: "Your account",
    body: list([
      "You must give accurate details when you sign up.",
      "You are responsible for keeping your sign-in details safe.",
      "You can sign in with email or with Google, where that option is offered.",
      "Organisers may remove an account if it is misused.",
    ]),
  },
  {
    title: "Walks and your safety",
    body: [
      "Walks are outdoor activities. Weather, paths and fitness vary. You take part at your own risk.",
      list([
        "You must decide whether you are fit to walk on the day. Clock-in includes a confirmation that you are fit to take part and responsible for your own safety.",
        "Walks are self-led in the sense that you look after yourself on the route.",
        "Follow any instructions from the walk leader on the day.",
        "If you share health information at clock-in, it is so a leader can help if you need it. It is not a medical service.",
      ]),
    ].join("\n\n"),
  },
  {
    title: "Acceptable use",
    body: "Do not use the site to harass others, share others’ private details, or break the law.",
  },
  {
    title: "Privacy",
    body: "How we use personal information is explained in our [Privacy Policy](/privacy-policy).",
  },
  {
    title: "Changes",
    body: "We may update these terms. The date at the top of this page will change when we do. Continued use of the site after a change means you accept the updated terms.",
  },
  {
    title: "Contact",
    body: "Questions about these terms: contact a group organiser through the website once you are signed in, or via the person who invited you.",
  },
];

function seedLegalPage(opts: {
  title: string;
  lead: string;
  rest: string;
  icon: "privacy" | "terms";
  current: string;
  closing: string;
  sections: { title: string; body: string }[];
}): PuckData {
  return puckPage([
    puckBlock("LegalHero", 1, {
      title: opts.title,
      lead: opts.lead,
      rest: opts.rest,
      updated: LEGAL_UPDATED,
      icon: opts.icon,
      current: opts.current,
    }),
    ...opts.sections.map((section, i) => puckBlock("LegalSection", i + 2, section)),
    puckBlock("LegalClosing", opts.sections.length + 2, { closing: opts.closing }),
  ]);
}

export function seedPrivacyDesign(): PuckData {
  return seedLegalPage({
    title: "Privacy Policy",
    lead: "How Bury Steps uses your information:",
    rest: "what we collect, why we need it, who can see it, and your rights.",
    icon: "privacy",
    current: "/privacy-policy",
    closing: "By using Bury Steps, you agree to this Privacy Policy.",
    sections: PRIVACY_SECTIONS,
  });
}

export function seedTermsDesign(): PuckData {
  return seedLegalPage({
    title: "Terms of Service",
    lead: "The rules for using Bury Steps:",
    rest: "your account, walks and your safety, acceptable use, and our responsibilities.",
    icon: "terms",
    current: "/terms-of-service",
    closing: "By using Bury Steps, you agree to this Terms of Service.",
    sections: TERMS_SECTIONS,
  });
}
