export const MAX_HOW_THIS_STARTED_TITLE = 80;
export const MAX_HOW_THIS_STARTED_EYEBROW = 80;
export const MAX_HOW_THIS_STARTED_TEASER = 400;
export const MAX_HOW_THIS_STARTED_BODY = 12_000;

export const DEFAULT_HOW_THIS_STARTED_TITLE = "How this started";
export const DEFAULT_HOW_THIS_STARTED_EYEBROW = "Kindness · Friendship · Welcome";
export const DEFAULT_HOW_THIS_STARTED_TEASER =
  "What started out as a self-help mission to get myself fit after my diabetes diagnosis began with a simple goal: walking four miles a day with the dogs after work. It has grown into a community of walkers supporting one another week after week.";

/** Full “How this started” story in the About drawer (blank line = new paragraph). */
export const DEFAULT_HOW_THIS_STARTED_BODY = `What started out as a self-help mission to get myself fit after my diabetes diagnosis began with a simple goal: walking four miles a day with the dogs after work. I lost a fair bit of weight and was incredibly proud of myself.

Then an unexpected death in the family knocked everyone sideways. I found myself thinking, "Why should I bother when someone as fit as my brother-in-law could die without any warning, without any indication that he was ill?"

So I gave up the long walks.

The weight piled back on, and then some.

Later, I had a routine appointment with my doctor, which led to blood tests, urine tests, and stool tests. When the results came back, there seemed to be so many things wrong with me.

It was time to start working on my fitness again.

I knew that if I wanted to get back into walking, I wouldn't have the motivation to do it on my own. So I put a message out on Facebook asking if anyone would be interested in walking as a group.

I was inundated with messages.

I set up a Facebook group and asked AI for a good name. Bury Steps Walking Group was born.

After just a couple of weeks, well over 100 people had joined the Facebook group. Encouraged by the response, I decided to take the plunge and create our first event: a nice, gentle, flat walk along Tottington Lines, an old railway track that had been transformed into a countryside walking route.

I first took out public liability insurance for the group, then discovered I also needed a health and safety policy, a mission statement, a constitution, sign-in sheets, incident report forms, and risk assessments. It was far more work than I had anticipated.

But at the front of my mind was the reason I had started all of this in the first place: I had to do something for myself.

So I carried on and got everything organised.

Onwards to Walk Number One.

Fourteen people joined me on that first walk. Fourteen people I had never met before. Fourteen people who got on with each other like a house on fire.

"This could be big," I thought to myself.

So I arranged another walk.

Now, just three months in, we have more than 200 members in our Facebook group, with around 20 regular walkers joining us week after week.

Recently, I was contacted by Bury Council's Live Well Team and asked whether I would be willing to affiliate the group with them. Absolutely. It was a complete no-brainer.

I am incredibly proud that my efforts, combined with the cooperation and enthusiasm of all our walkers, have paid off and are becoming something bigger and far more effective than I ever imagined.

What started as a personal mission to improve my own health has grown into something that could make a real difference to so many people.

To me, that is what Bury Steps is all about: ensuring that everyone feels welcome, supported, and able to take those first steps towards improving their health and wellbeing.

I would like to thank each and every one of our members for being part of this journey. I know it can be a bit of a nuisance having to sign in at every walk, but this is one of the requirements set by our insurers.

Please bear with me. I am currently working on ways to make the process as simple and straightforward as possible for everyone.

What began as a walk for my own health has become a community. A place where friendships are formed, confidence is built, and people support one another to become healthier and happier versions of themselves.

Thank you all for helping make Bury Steps Walking Group what it is today.

Onwards and upwards to bigger and better things.`;

export const HOMEPAGE_MEMBER_NOTICES_LIMIT = 5;

export function parseHowThisStartedTitle(raw: string): string | "invalid" {
  const title = raw.trim().replace(/\s+/g, " ");
  if (title.length < 2 || title.length > MAX_HOW_THIS_STARTED_TITLE) return "invalid";
  return title;
}

export function parseHowThisStartedEyebrow(raw: string): string | "invalid" {
  const eyebrow = raw.trim().replace(/\s+/g, " ");
  if (eyebrow.length === 0) return "";
  if (eyebrow.length > MAX_HOW_THIS_STARTED_EYEBROW) return "invalid";
  return eyebrow;
}

export function parseHowThisStartedTeaser(raw: string): string | "invalid" {
  const teaser = raw.trim().replace(/\s+/g, " ");
  if (teaser.length < 8 || teaser.length > MAX_HOW_THIS_STARTED_TEASER) return "invalid";
  return teaser;
}

export function parseHowThisStartedBody(raw: string): string | "invalid" {
  const body = raw.replace(/\r\n/g, "\n").trim();
  if (body.length < 40 || body.length > MAX_HOW_THIS_STARTED_BODY) return "invalid";
  return body;
}

/** Split stored story text into paragraphs for the About drawer. */
export function howThisStartedParagraphs(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export const MAX_ABOUT_LIST_ITEMS = 24;
export const MAX_ABOUT_LIST_ITEM = 160;
const MAX_ABOUT_RULE_TITLE = 80;
const MAX_ABOUT_RULE_BODY = 280;
export const MAX_ABOUT_RULES = 20;
export const MAX_ABOUT_SECTION_HEADING = 80;

/** Real, visible headings for each About-drawer section — distinct from the
 * "Goals"/"Places"/etc. labels used only to organise the admin settings list. */
export const DEFAULT_ABOUT_GOALS_HEADING = "More than just a walking group";
export const DEFAULT_ABOUT_PLACES_HEADING = "What we do";
export const DEFAULT_ABOUT_EXPECT_HEADING = "What you can expect";
export const DEFAULT_ABOUT_RULES_HEADING = "Group rules";

export type AboutRule = { title: string; body: string };

export const DEFAULT_ABOUT_GOALS = [
  "Lose weight",
  "Improve your fitness and mobility",
  "Build confidence",
  "Improve your mental wellbeing",
  "Meet new people and make friends",
  "Enjoy fresh air and local scenery",
  "Get back into exercise after a break",
  "Feel less isolated",
  "Create healthier habits",
  "Spend a few hours in good company on a Sunday afternoon",
] as const;

export const DEFAULT_ABOUT_PLACES = [
  "Country parks",
  "Riverside paths",
  "Woodland trails",
  "Nature reserves",
  "Scenic local routes",
  "Gentle rambles suitable for beginners",
] as const;

export const DEFAULT_ABOUT_EXPECT = [
  "Friendly and welcoming atmosphere",
  "Open to all",
  "Particularly suited to middle-aged and older adults, although everyone is welcome",
  "Ideal for beginners and those returning to exercise",
  "No pressure and no judgement",
  "Walk at your own pace",
  "Encouragement rather than competition",
  "Supportive conversations and shared experiences",
  "Opportunities to make genuine friendships",
  "A focus on wellbeing, enjoyment and community",
] as const;

const DEFAULT_ABOUT_RULES: AboutRule[] = [
  {
    title: "Respect every walker",
    body: "Kindness first, always. Everyone’s pace, story and ability deserve equal respect.",
  },
  {
    title: "Walk at your own pace",
    body: "No pressure to keep up or slow down. Enjoy the rhythm that suits you.",
  },
  {
    title: "Keep conversations positive",
    body: "Share laughs, ideas and support. Avoid gossip or negativity.",
  },
  {
    title: "Listen to the walk leaders",
    body: "They are there to keep everyone safe and on track.",
  },
  {
    title: "Stay safe and aware",
    body: "Mind paths, rivers and roads. Look out for one another.",
  },
  {
    title: "No judgement, no pressure",
    body: "Whether you are chatty or quiet, fast or steady, you belong.",
  },
  {
    title: "Respect nature and locals",
    body: "Leave no litter, greet passers-by, and keep dogs under control.",
  },
  {
    title: "Keep it inclusive",
    body: "All ages, backgrounds and fitness levels are welcome.",
  },
  {
    title: "Share ideas for walks",
    body: "The walks belong to all of us. Every member has something to contribute.",
  },
  {
    title: "Enjoy yourself",
    body: "Fresh air, good company and better days are what we are here for.",
  },
];

export function serializeAboutList(items: readonly string[]): string {
  return items.join("\n");
}

export function serializeAboutRules(rules: readonly AboutRule[]): string {
  return rules.map((rule) => `${rule.title} | ${rule.body}`).join("\n");
}

export const DEFAULT_ABOUT_GOALS_TEXT = serializeAboutList(DEFAULT_ABOUT_GOALS);
export const DEFAULT_ABOUT_PLACES_TEXT = serializeAboutList(DEFAULT_ABOUT_PLACES);
export const DEFAULT_ABOUT_EXPECT_TEXT = serializeAboutList(DEFAULT_ABOUT_EXPECT);
export const DEFAULT_ABOUT_RULES_TEXT = serializeAboutRules(DEFAULT_ABOUT_RULES);

export function parseAboutSectionHeading(raw: string): string | "invalid" {
  const heading = raw.trim().replace(/\s+/g, " ");
  if (heading.length < 2 || heading.length > MAX_ABOUT_SECTION_HEADING) return "invalid";
  return heading;
}

export function parseAboutList(raw: string): string[] | "invalid" {
  const items = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  if (items.length < 1 || items.length > MAX_ABOUT_LIST_ITEMS) return "invalid";
  if (items.some((item) => item.length > MAX_ABOUT_LIST_ITEM)) return "invalid";
  return items;
}

export function parseAboutRules(raw: string): AboutRule[] | "invalid" {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 1 || lines.length > MAX_ABOUT_RULES) return "invalid";

  const rules: AboutRule[] = [];
  for (const line of lines) {
    const sep = line.indexOf("|");
    if (sep <= 0) return "invalid";
    const title = line.slice(0, sep).trim().replace(/\s+/g, " ");
    const body = line.slice(sep + 1).trim().replace(/\s+/g, " ");
    if (
      title.length < 2 ||
      title.length > MAX_ABOUT_RULE_TITLE ||
      body.length < 2 ||
      body.length > MAX_ABOUT_RULE_BODY
    ) {
      return "invalid";
    }
    rules.push({ title, body });
  }
  return rules;
}

/** Prefer stored list text; fall back to defaults when empty. */
export function aboutListFromStored(raw: string | null | undefined, fallback: readonly string[]): string[] {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return [...fallback];
  const parsed = parseAboutList(trimmed);
  return parsed === "invalid" ? [...fallback] : parsed;
}

export function aboutRulesFromStored(raw: string | null | undefined): AboutRule[] {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return DEFAULT_ABOUT_RULES.map((rule) => ({ ...rule }));
  const parsed = parseAboutRules(trimmed);
  return parsed === "invalid"
    ? DEFAULT_ABOUT_RULES.map((rule) => ({ ...rule }))
    : parsed;
}
