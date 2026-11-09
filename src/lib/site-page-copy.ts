import { DEFAULT_FAQ_CATEGORIES } from "@/lib/faqs";
import {
  DEFAULT_ABOUT_EXPECT,
  DEFAULT_ABOUT_EXPECT_HEADING,
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
  /** How this started's three words ("Kindness · Friendship · Welcome"). */
  aboutWords?: string;
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
    puckBlock("HomeAbout", 2, {
      title: input.aboutTitle,
      teaser: input.aboutTeaser,
      ...(input.aboutWords ? { words: input.aboutWords } : {}),
    }),
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

type LegalHeroIcon = "about" | "privacy" | "terms" | "how" | "expect" | "rules" | "essentials";

function seedLegalPage(opts: {
  title: string;
  lead: string;
  rest: string;
  icon: LegalHeroIcon;
  current: string;
  closing: string;
  sections: { title: string; body: string }[];
  docs?: "legal" | "guide";
  updated?: string;
}): PuckData {
  return puckPage([
    puckBlock("LegalHero", 1, {
      title: opts.title,
      lead: opts.lead,
      rest: opts.rest,
      updated: opts.updated ?? LEGAL_UPDATED,
      icon: opts.icon,
      current: opts.current,
      docs: opts.docs ?? "legal",
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

export const HOW_IT_WORKS_SECTIONS: { title: string; body: string }[] = [
  {
    title: "Create an account",
    body: [
      "Joining is free and takes about a minute. [Sign up](/sign-up) with your email address or your Google account, add your name, and that’s it — you’re part of the group.",
      "Your account is what lets you clock in on a walk, read the organisers’ notices and keep a record of the walks you’ve been on. You choose which emails you get, and you can change that at any time in your email preferences.",
    ].join("\n\n"),
  },
  {
    title: "See the walks",
    body: [
      "Every walk coming up is on the [Walks](/walks) page, soonest first. Open one to see everything you need before you go: the day and time, where to meet, a map, how long and how hilly the route is, and what’s there on the day, such as toilets, parking or a café.",
      "Each meeting point has a map pin and a what3words address, so you can find the exact spot even in a big car park. Walks can be shared with a link, so you can send one to a friend who’d like to come along.",
    ].join("\n\n"),
  },
  {
    title: "Clock in on the day",
    body: [
      "When you arrive at the meeting point, open the walk on your phone and clock in. It takes a few seconds and tells the walk leader you’re there, so nobody is counted twice or left behind.",
      "As you clock in, you confirm that you’re fit to walk that day. You can also add an emergency contact, and anything the leader should know about your health. Only the organisers can see these, and only so they can help if you need it.",
    ].join("\n\n"),
  },
  {
    title: "Walk at your pace",
    body: [
      "This isn’t a race. Walk at whatever speed suits you — the group goes at the pace of its walkers, and nobody gets left behind. Stop for a breather, chat, take photos, or just enjoy the quiet.",
      "The walk leaders know the route and keep an eye on everyone. If you’re unsure about anything on the way, just ask one of them.",
    ].join("\n\n"),
  },
  {
    title: "Clock out when done",
    body: [
      "At the end of the walk, clock out on the same page. If you need to leave early, that’s completely fine — clock out when you go, so the leader knows you’ve left safely and isn’t waiting for you.",
      "Your walk then shows in your history, whether you stayed for all of it or part of it.",
    ].join("\n\n"),
  },
  {
    title: "Read the notices",
    body: [
      "The organisers post news on the [Notices](/notices) page: changes to a walk, new routes, group news and anything to do with safety. Short messages show in the bell at the top of the page, and you can choose to get them by email too.",
      "A notice you haven’t read yet is marked New, so nothing important slips past.",
    ].join("\n\n"),
  },
  {
    title: "Watch the miles add up",
    body: [
      "The [Progress](/progress) page shows how the group is walking together this month: every clock-in counts towards a shared goal, and people with the same number of walks sit side by side. There are no winners or losers — it’s about turning up, not speed or distance.",
      "You’ll also see your own month, year and how many weeks in a row you’ve walked, and earn badges along the way.",
    ].join("\n\n"),
  },
  {
    title: "Look back",
    body: [
      "Your [History](/history) keeps every walk you’ve clocked in to, newest first, with whether you stayed for the whole walk or left early. Search it by walk or meeting point, or filter it to find a particular day.",
      "It’s a nice way to see how far you’ve come since your first step with the group.",
    ].join("\n\n"),
  },
];

export function seedHowItWorksDesign(): PuckData {
  return seedLegalPage({
    title: "How it works",
    lead: "Joining is free.",
    rest: "Make an account, pick a walk and meet us there. Here is how it all works, step by step.",
    icon: "how",
    current: "/how-it-works",
    closing: "Come for a walk — everyone is welcome.",
    docs: "guide",
    updated: "",
    sections: HOW_IT_WORKS_SECTIONS,
  });
}

export type WhatToExpectSeedInput = {
  expectHeading: string;
  expect: string[];
};

export function seedWhatToExpectDesign(input: WhatToExpectSeedInput): PuckData {
  return seedLegalPage({
    title: "What to expect",
    lead: "A friendly, welcoming group",
    rest: "for every age and every pace. No pressure, no judgement, just good company on the paths.",
    icon: "expect",
    current: "/what-to-expect",
    closing: "Come for a walk — everyone is welcome.",
    docs: "guide",
    updated: "",
    sections: [
      {
        title: "A friendly welcome",
        body: [
          "Bury Steps is a friendly, welcoming group for every age and every pace. Whether it’s your first walk in years or you’re out every weekend, you’ll be made to feel at home from the moment you arrive.",
          "There’s no pressure and no judgement. Nobody minds how fast you walk, how far you go, or how fit you are. What matters is that you came.",
        ].join("\n\n"),
      },
      {
        title: input.expectHeading || DEFAULT_ABOUT_EXPECT_HEADING,
        body: list(input.expect),
      },
      {
        title: "On the day",
        body: [
          "Get to the meeting point a few minutes early and look out for the group. Clock in on your phone when you arrive, so the walk leader knows you’re there. If you’re new, say hello — someone will happily walk with you and show you the ropes.",
          "The leader will set off once everyone is ready. The walk goes at a comfortable pace, with time to chat, catch your breath and enjoy the views. If you need to leave early, just clock out as you go.",
        ].join("\n\n"),
      },
      {
        title: "Who walks with us",
        body: [
          "The group suits beginners and people getting back into exercise, as well as regular walkers. Many of our members are middle-aged or older, but everyone is welcome, and plenty of people come along on their own.",
          "People walk with us for all sorts of reasons: to get fitter, to feel better, to get outdoors, or simply to meet new people. You’ll find something here whatever your reason.",
        ].join("\n\n"),
      },
      {
        title: "Taking the first step",
        body: [
          "Joining a new group can feel daunting. You don’t have to have it all figured out — come as you are. Have a look at the [walks coming up](/walks), read [how it works](/how-it-works), and pick one that suits you.",
          "Have a question first? [Get in touch](/contact) and an organiser will get back to you.",
        ].join("\n\n"),
      },
    ],
  });
}

export type GroupRulesSeedInput = {
  rulesHeading: string;
  rules: RuleSeed[];
};

export function seedGroupRulesDesign(input: GroupRulesSeedInput): PuckData {
  return seedLegalPage({
    title: "Group rules",
    lead: "A few simple rules",
    rest: "that keep the group kind, safe and welcoming for everyone.",
    icon: "rules",
    current: "/group-rules",
    closing: "Questions about a rule? Ask us.",
    docs: "guide",
    updated: "",
    sections: [
      {
        title: "Why we have rules",
        body: [
          "Bury Steps works because everyone looks out for each other. These few simple rules aren’t there to tell anyone off — they’re what keeps the group kind, safe and welcoming, so that everyone wants to come back next time.",
          "By coming on a walk, you agree to follow them. Most of them are just good manners.",
        ].join("\n\n"),
      },
      {
        title: input.rulesHeading || DEFAULT_ABOUT_RULES_HEADING,
        body: rulesList(input.rules),
      },
      {
        title: "Staying safe on a walk",
        body: [
          "Walks are outdoors, and paths, weather and fitness all vary. You take part at your own risk, so only come if you feel well enough on the day. Clock in when you arrive and clock out when you leave, even if you leave early, so the leader always knows who is still on the walk.",
          "Follow the walk leader’s instructions, take care near roads, rivers and steep ground, and keep the group in sight. If you feel unwell or need to stop, tell a leader straight away — nobody will mind.",
        ].join("\n\n"),
      },
      {
        title: "Looking after the countryside",
        body: [
          "Leave gates as you find them, stick to the paths, and take your litter home. Be friendly to the people we pass and to the farmers and landowners whose land we walk through.",
          "Dogs are welcome on walks marked as dog friendly. Keep them under control, on a lead near livestock and wildlife, and always clear up after them.",
        ].join("\n\n"),
      },
      {
        title: "If something goes wrong",
        body: [
          "If there’s an accident or anyone is hurt, tell a walk leader at once. The organisers keep a record of anything that happens on a walk, so it can be looked after properly and learned from.",
          "If something has upset you, or you’re worried about anything in the group, please [get in touch](/contact). An organiser will listen and help.",
        ].join("\n\n"),
      },
    ],
  });
}

export function seedWalkEssentialsDesign(): PuckData {
  return puckPage([
    puckBlock("LegalHero", 1, {
      title: "Walk essentials",
      lead: "Know before you go.",
      rest: "Each walk's page shows what's there on the day: toilets, parking, dogs, stiles and more.",
      updated: "",
      icon: "essentials",
      current: "/walk-essentials",
      docs: "guide",
    }),
    puckBlock("LegalSection", 2, {
      title: "Know before you go",
      body: [
        "Every walk is different. Some start from a car park with a café and toilets; others meet at a roadside gate with stiles along the way. So that nothing catches you out, each walk’s page shows which of the essentials below apply to that walk.",
        "Have a look at the walk before you set off — especially if you’re bringing a dog or a pushchair, or coming by bus.",
      ].join("\n\n"),
    }),
    puckBlock("WalkEssentialsList", 3, {
      title: "On each walk’s page",
      after: "Each walk page also shows the distance, how hilly the route is, and where to meet.",
    }),
    puckBlock("LegalSection", 4, {
      title: "What to bring",
      body: [
        "Comfortable footwear with a good grip matters most — walking boots if the walk recommends them, as paths can be muddy or uneven. Dress for the weather in layers, and bring a waterproof if there’s any chance of rain.",
        list([
          "Water, and a snack on longer walks",
          "Your phone, charged, to clock in and out",
          "Any medication you might need",
          "Sun cream and a hat in summer, gloves and a warm hat in winter",
        ]),
      ].join("\n\n"),
    }),
    puckBlock("LegalSection", 5, {
      title: "Getting there",
      body: [
        "Each walk’s meeting point has a map pin and a what3words address, so you can find the exact spot. The free [walking apps](/apps) help with directions and with following the route on the day.",
        "Walks near public transport are marked, and so is parking. If you’re not sure how to get to a walk, [ask us](/contact).",
      ].join("\n\n"),
    }),
    puckBlock("LegalClosing", 6, { closing: "Not sure what to bring? Ask us." }),
  ]);
}
