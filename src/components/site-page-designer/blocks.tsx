"use client";

import { createElement, type ReactNode } from "react";
import { IntentLink as Link } from "@/components/intent-link";
import {
  Apple,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  Footprints,
  HandHeart,
  Handshake,
  Heart,
  History,
  LogIn,
  LogOut,
  MapPin,
  Mountain,
  Play,
  ShieldCheck,
  Smile,
  Star,
  Sun,
  UserPlus,
  Users,
} from "lucide-react";
import { ShadcnFaq } from "@/components/shadcnio/faq";
import { isFaqLook } from "@/components/shadcnio/faq-looks";
import { ShadcnReviews } from "@/components/shadcnio/reviews";
import {
  QuotesCarouselLook,
  QuotesFeaturedLook,
  QuotesRowsLook,
  isQuotesLook,
  type QuotesOptions,
} from "@/components/shadcnio/reviews-looks";
import { AboutSplitLook, AboutWordsLook, isAboutLook, splitWords } from "@/components/shadcnio/about-looks";
import { HeroLooks, isHeroLook } from "@/components/shadcnio/hero-looks";
import { DEFAULT_HOW_THIS_STARTED_EYEBROW } from "@/lib/homepage-copy";
import { ShadcnLegal, type ShadcnLegalIcon } from "@/components/shadcnio/legal";
import { ShadcnContactForm } from "@/app/(site)/contact/contact-form";
import {
  BUTTON_OUTLINE,
  BUTTON_PRIMARY,
  Guides,
  MiniNote,
  MiniWalk,
  PillLink,
  Section,
  SectionHead,
  Tile,
  WALKS_GRID,
} from "@/components/shadcnio/parts";
import { BandField, HeroField } from "@/components/shadcnio/ascii-field";
import { MoreRows, stripTone } from "@/components/shadcnio/more-rows";
import {
  CtaBandLook,
  CtaNextLook,
  CtaSplitLook,
  ExpectCellsLook,
  ExpectNumberedLook,
  ExpectTicksLook,
  WalksNextLook,
  WalksRowsLook,
  WalksWeekLook,
  isCtaLook,
  isExpectLook,
  isWalksLook,
} from "@/components/shadcnio/home-section-looks";
import { GALLERY_GRID_3, PHONE_LIST } from "@/components/shadcnio/grids";
import { SectionTitle } from "@/components/section-title";
import { Button } from "@/components/ui/button";
import { CountingNumber } from "@/components/ui/counting-number";
import { HeroCopy } from "@/components/hero-copy";
import { DecorIcon } from "@/components/decor-icon";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import type { TestimonialView } from "@/lib/testimonials";
import { essentialIcon } from "@/lib/walk-essentials";
import { BodyText } from "./body-text";
import { CountsText } from "./counts-text";
import { useSitePageLive } from "./live";

const number = new Intl.NumberFormat("en-GB");
const EXPECT_ICONS = [Smile, Users, Heart, Footprints, ShieldCheck, Sun, Handshake, Mountain];
const GOAL_ICONS = [<Heart key="h" />, <Mountain key="m" />, <Smile key="s" />, <Users key="u" />];
const HOW_ICONS = [<UserPlus key="a" />, <CalendarDays key="b" />, <LogIn key="c" />, <Footprints key="d" />, <LogOut key="e" />, <Bell key="f" />, <BarChart3 key="g" />, <History key="h" />];

function tidyPlace(name: string) {
  const words = name
    .replace(/\b(car ?park|parking)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const shouting = name === name.toUpperCase();
  return words.map((word) => (shouting ? word.charAt(0) + word.slice(1).toLowerCase() : word)).join(" ");
}

/** A designer switch: on unless it's been turned off (so pages saved before it keep it on). */
const isOn = (value: unknown) => value !== "off";

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asItems(value: unknown): { title: string; sub?: string }[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return { title: item };
    if (typeof item !== "object" || item === null) return { title: "" };
    const row = item as { title?: unknown; sub?: unknown };
    return { title: asText(row.title), sub: asText(row.sub) || undefined };
  });
}

/** Up to four short place names (Bury first), as the hero lists them. */
function heroPlaces(places: { name: string }[], most = 4): string[] {
  return [
    "Bury",
    ...places
      .map((place) => tidyPlace(place.name))
      .filter((name) => name.length >= 3 && name.length <= 14 && !/^(bury|test)\b/i.test(name) && /[aeiou]/i.test(name)),
  ]
    .filter((name, i, all) => all.indexOf(name) === i)
    .slice(0, most);
}

/** Up to five signpost names: the walks most recently finished, newest first, in a few words each ("Greenmount Circular wellbeing walk" → "Greenmount"). */
function heroSigns(titles: string[], most = 5): string[] {
  return titles
    .map((title) =>
      title
        .split(/[,(\n]/)[0]!
        .replace(/(\s+(circular|well-?being|walk))+\s*$/i, "")
        .trim(),
    )
    .filter((name) => name.length >= 3 && !/^test\b/i.test(name))
    .filter((name, i, all) => all.findIndex((other) => other.toLowerCase() === name.toLowerCase()) === i)
    .slice(0, most);
}

/** The words a changing heading rolls through ("walk. · chat. · breather."), up to six. */
function heroWords(raw: string): string[] {
  return raw
    .split(/[·•|]/)
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function HomeHeroBlock(props: Record<string, unknown>) {
  const { data, logo, joinHref } = useSitePageLive();
  const places = heroPlaces(data.places);
  const counts = { upcoming: data.upcomingCount, members: data.members, walks: data.walksThisYear, places };
  const numbers = asText(props.numbers).trim();
  const sentence = (
    <>
      {numbers ? (
        // Their own sentence, with the live numbers put in ({upcoming}, {members}, {walks}, {places}).
        <CountsText counting counts={counts} text={numbers} />
      ) : (
        <>
          <span className="font-medium text-foreground">
            {/* Counting up as they land, as the built-in homepage's (shadcnio/home.tsx). */}
            <CountingNumber grouping trigger="view" value={data.upcomingCount} /> upcoming walks,{" "}
            <CountingNumber grouping trigger="view" value={data.members} /> members and{" "}
            <CountingNumber grouping trigger="view" value={data.walksThisYear} /> walks so far
          </span>{" "}
          around <CountsText counts={counts} text="{places}" />.
        </>
      )}{" "}
      <span data-guest-home="">
        <CountsText counting counts={counts} text={asText(props.guestClose, "Join for free, and clock in on the day of the walk.")} />
      </span>
      <span data-member-home="">
        <CountsText counting counts={counts} text={asText(props.memberClose, "Pick your next walk, and clock in when you get there.")} />
      </span>
    </>
  );
  const look = isHeroLook(props.look) ? props.look : "original";
  if (look !== "original") {
    const words = heroWords(asText(props.words).trim() || "walk. · chat. · breather.");
    return (
      <HeroLooks
        boxText={asText(props.freeText).trim() || "to join, at your own pace"}
        boxTitle={asText(props.freeTitle).trim() || "Free"}
        counts={counts}
        everyPlace={heroPlaces(data.places, 12)}
        groupNote={
          <CountsText counts={counts} text={asText(props.groupNote).trim() || "**Nobody gets left behind.** Walk at your own pace."} />
        }
        heading={{
          before: asText(props.headingBefore, "The"),
          word: asText(props.headingWord, "walking"),
          after: asText(props.headingAfter, "group"),
          rest: asText(props.headingRest, "all of Bury steps out with."),
        }}
        joinHref={joinHref}
        kicker={asText(props.kicker, "Bury Steps is a free, friendly walking group from Bury")}
        logoSrc={isOn(props.logo) ? logo.src : ""}
        look={look}
        moving={isOn(props.moving)}
        places={places}
        sentence={sentence}
        signs={heroSigns(data.finished)}
        trailNote={
          <CountsText counts={counts} text={asText(props.trailNote).trim() || "**{walks} walks** walked so far this year"} />
        }
        walks={data.upcoming}
        words={words.length > 0 ? words : ["walk."]}
        wordsLead={asText(props.wordsLead).trim() || "Come for a"}
      />
    );
  }
  return (
    <section aria-labelledby="home-heading" className="border-t first-of-type:border-t-0">
      <div
        className="px-5 md:px-12 flex flex-col items-center relative isolate justify-center min-h-[29rem] sm:min-h-[30rem] md:min-h-[36rem] lg:min-h-[35rem] xl:min-h-[34rem] gap-8 pt-6 pb-8 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14"
        data-slot="hero"
      >
        <HeroField heading="home-heading" />
        <div className="flex flex-col gap-4 md:gap-5 max-w-5xl mx-auto min-w-0 items-center text-center">
          <p className="text-center text-muted-foreground text-xs leading-4 mb-1 md:mb-2" data-slot="docs-affiliation">
            <span>{asText(props.kicker, "Bury Steps is a free, friendly walking group from Bury")}</span>
          </p>
          <h1
            className="text-balance font-semibold text-4xl leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl"
            id="home-heading"
          >
            {asText(props.headingBefore, "The")}{" "}
            <span className="whitespace-nowrap">
              {isOn(props.logo) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="me-[0.18em] inline-block size-[0.82em] -translate-y-[0.05em] rounded-full border border-foreground/[0.12] object-contain bg-background align-middle"
                  height={96}
                  src={logo.src}
                  width={96}
                />
              ) : null}
              {asText(props.headingWord, "walking")}
            </span>{" "}
            {asText(props.headingAfter, "group")}
            <br className="max-sm:hidden" /> {asText(props.headingRest, "all of Bury steps out with.")}
          </h1>
          <p className="max-w-2xl text-muted-foreground sm:text-lg md:text-xl text-balance">{sentence}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link className={BUTTON_PRIMARY} data-guest-home="" href={joinHref}>
            Join the group
          </Link>
          <Link className={BUTTON_PRIMARY} data-member-home="" href="/overview">
            Your dashboard
          </Link>
          <Link className={BUTTON_OUTLINE} href="/walks">
            See the walks
          </Link>
        </div>
      </div>
    </section>
  );
}


export function HomeAboutBlock(props: Record<string, unknown>) {
  const title = asText(props.title, "How this started");
  const teaser = asText(props.teaser);
  const [lead, ...rest] = teaser.split(/(?<=[.!?])\s+/);
  const look = isAboutLook(props.look) ? props.look : "original";
  if (look !== "original") {
    const shared = {
      id: "home-about-heading",
      title,
      lead,
      rest: rest.join(" "),
      words: isOn(props.showWords) ? splitWords(asText(props.words, DEFAULT_HOW_THIS_STARTED_EYEBROW)) : [],
      readMore: isOn(props.readMore),
      strip: stripTone(props.moreStrip),
    };
    return (
      <Section id="home-about-heading">
        {look === "split" ? <AboutSplitLook {...shared} /> : <AboutWordsLook {...shared} />}
      </Section>
    );
  }
  return (
    <Section id="home-about-heading">
      <div className="px-5 md:px-12 flex flex-col items-center gap-5 py-12 text-center md:py-16">
        <div className="mx-auto flex max-w-2xl min-w-0 flex-col items-center gap-3 lg:gap-4">
          <SectionTitle
            className="text-balance font-semibold text-3xl tracking-tighter md:text-4xl"
            id="home-about-heading"
            text={title}
          />
          <p className="text-pretty text-muted-foreground md:text-lg">
            <span className="font-medium text-foreground">{lead}</span> {rest.join(" ")}
          </p>
        </div>
        {isOn(props.readMore) ? (
          <div className="flex shrink-0 justify-center gap-2">
            <PillLink arrow href="/about">
              Read more
            </PillLink>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

export function HomeWalksBlock(props: Record<string, unknown>) {
  const { data } = useSitePageLive();
  const walksLook = isWalksLook(props.look) ? props.look : "original";
  const counts = { upcoming: data.upcomingCount, members: data.members, walks: data.walksThisYear, places: heroPlaces(data.places) };
  return (
    <Section id="home-walks-heading">
      <SectionHead
        action={{ href: "/walks", label: "See all walks" }}
        id="home-walks-heading"
        lead={<CountsText counts={counts} text={asText(props.lead).trim() || "{upcoming} walks on the calendar,"} />}
        rest={
          <CountsText
            counts={counts}
            text={asText(
              props.rest,
              "each one led by a volunteer walk leader, with the meeting point, distance and grade. Members see every detail and clock in on the day.",
            )}
          />
        }
        title={asText(props.title, "Walks coming up, every week")}
      />
      {walksLook === "rows" ? (
        <WalksRowsLook tone={stripTone(props.moreStrip)} walks={data.upcoming} />
      ) : walksLook === "next" ? (
        <WalksNextLook walks={data.upcoming} />
      ) : walksLook === "week" ? (
        <WalksWeekLook walks={data.upcoming} />
      ) : (
      <MoreRows className={WALKS_GRID} columns={3} first={3} label="Walks coming up" tone={stripTone(props.moreStrip)}>
        {data.upcoming.slice(0, 6).map((walk, i, shownWalks) => (
          <Tile
            href={walk.href}
            key={walk.id}
            sub={walk.detail}
            title={walk.title}
            visual={{
              kind: "fan",
              cards: [2, 1, 0].map((k) => {
                const shown = shownWalks[(i + k) % shownWalks.length]!;
                return <MiniWalk detail={shown.detail.split(" · ").slice(1).join(" · ")} key={k} title={shown.title} when={shown.when} />;
              }),
            }}
          />
        ))}
      </MoreRows>
      )}
    </Section>
  );
}

export function HomeExpectBlock(props: Record<string, unknown>) {
  const items = asItems(props.items).slice(0, 6);
  const look = isExpectLook(props.look) ? props.look : "original";
  const lead = asText(props.lead, "A friendly, welcoming group");
  const rest = asText(props.rest, "for every age and every pace. No pressure, no judgement, just good company on the paths.");
  const title = asText(props.title, "What you can expect");
  const tone = stripTone(props.moreStrip);
  const points = items.map((item) => item.title);
  // Its heading sits beside the list, so it brings its own.
  if (look === "numbered")
    return (
      <Section id="home-expect-heading">
        <ExpectNumberedLook id="home-expect-heading" items={points} lead={lead} rest={rest} title={title} tone={tone} />
      </Section>
    );
  if (look === "ticks" || look === "cells")
    return (
      <Section id="home-expect-heading">
        <SectionHead id="home-expect-heading" lead={lead} rest={rest} title={title} />
        {look === "ticks" ? (
          <ExpectTicksLook items={points} tone={tone} />
        ) : (
          <ExpectCellsLook icons={EXPECT_ICONS} items={points} tone={tone} />
        )}
      </Section>
    );
  return (
    <Section id="home-expect-heading">
      <SectionHead
        id="home-expect-heading"
        lead={asText(props.lead, "A friendly, welcoming group")}
        rest={asText(props.rest, "for every age and every pace. No pressure, no judgement, just good company on the paths.")}
        title={asText(props.title, "What you can expect")}
      />
      <MoreRows className={`${GALLERY_GRID_3} ${PHONE_LIST}`} columns={3} first={3} label="What you can expect" tone={stripTone(props.moreStrip)}>
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`}>
            <a>
              <strong>{item.title}</strong>
              <small>What to expect</small>
              <i />
              <span>
                <MiniNote icon={createElement(EXPECT_ICONS[i % EXPECT_ICONS.length]!, { "aria-hidden": true })} text={item.title} />
              </span>
            </a>
          </li>
        ))}
      </MoreRows>
    </Section>
  );
}

export function HomeHowItWorksBlock(props: Record<string, unknown>) {
  const steps = asItems(props.steps).slice(0, 6);
  return (
    <div data-guest-home="">
      <Section id="home-how-heading">
        <SectionHead
          action={{ href: "/walks", label: "See the walks" }}
          id="home-how-heading"
          lead={asText(props.lead, "Join, see the walks, clock in:")}
          rest={asText(props.rest, "that's all there is to it. The leader knows who's out walking, and you can look back on every walk you've done.")}
          title={asText(props.title, "How it works")}
        />
        <MoreRows className={WALKS_GRID} columns={3} first={3} label="How it works" tone={stripTone(props.moreStrip)}>
          {steps.map((step, i) => (
            <Tile
              key={`${step.title}-${i}`}
              phoneRow
              sub={step.sub}
              title={step.title}
              visual={{ kind: "square", icon: HOW_ICONS[i % HOW_ICONS.length] }}
            />
          ))}
        </MoreRows>
      </Section>
    </div>
  );
}

export function HomeGoalsBlock(props: Record<string, unknown>) {
  const items = asItems(props.items).slice(0, 6);
  return (
    <Section id="home-goals-heading">
      <SectionHead
        id="home-goals-heading"
        lead={asText(props.lead, "Fitter, happier and less alone,")}
        rest={asText(props.rest, "at whatever pace suits you. Members walk to get moving again, to feel better and to make friends.")}
        title={asText(props.title, "More than just a walking group")}
      />
      <MoreRows className={WALKS_GRID} columns={3} first={3} label="Group goals" tone={stripTone(props.moreStrip)}>
        {items.map((goal, i) => (
          <Tile key={`${goal.title}-${i}`} phoneRow sub="A reason to walk" title={goal.title} visual={{ kind: "circle", icon: GOAL_ICONS[i % 4] }} />
        ))}
      </MoreRows>
    </Section>
  );
}

export function HomeReviewsBlock(props: Record<string, unknown>) {
  const quotes = (Array.isArray(props.quotes) ? props.quotes : []).map((row, i) => {
    const item = row as Partial<TestimonialView>;
    return {
      id: item.id || `quote-${i}`,
      sortOrder: i,
      name: item.name || "",
      role: item.role || "",
      quote: item.quote || "",
      image: item.image,
    } satisfies TestimonialView;
  });
  if (quotes.length === 0) return null;
  const look = isQuotesLook(props.look) ? props.look : "original";
  const options: QuotesOptions = {
    readMore: isOn(props.readMore),
    first: [3, 4, 6].includes(Number(props.first)) ? Number(props.first) : 3,
    photos: isOn(props.photos),
    roles: isOn(props.roles),
    autoplay: props.autoplay === "on",
    strip: stripTone(props.moreStrip),
  };
  return (
    <Section id="home-reviews-heading">
      <SectionHead
        id="home-reviews-heading"
        lead={asText(props.lead, "Members love walking with us.")}
        rest={asText(props.rest, "Here's what a few of them say about the group, the walks and the people.")}
        title={asText(props.title, "From the group")}
      />
      {look === "carousel" ? (
        <QuotesCarouselLook o={options} quotes={quotes} />
      ) : look === "rows" ? (
        <QuotesRowsLook o={options} quotes={quotes} />
      ) : look === "featured" ? (
        <QuotesFeaturedLook o={options} quotes={quotes} />
      ) : (
        <ShadcnReviews readMore={options.readMore} testimonials={quotes} tone={options.strip} />
      )}
    </Section>
  );
}

export function HomeFaqBlock(props: Record<string, unknown>) {
  const { facebookUrl } = useSitePageLive();
  const categories = (Array.isArray(props.categories) ? props.categories : []).map((row, i) => {
    const item = row as { id?: string; label?: string };
    return {
      id: item.id || `faqcat-${i}`,
      slug: item.id || `faqcat-${i}`,
      label: item.label || "Topic",
      sortOrder: i,
      faqCount: 0,
    } satisfies FaqCategoryView;
  });
  const faqs = (Array.isArray(props.faqs) ? props.faqs : []).map((row, i) => {
    const item = row as { id?: string; categoryId?: string; question?: string; answer?: string };
    const category = categories.find((topic) => topic.id === item.categoryId);
    return {
      id: item.id || `faq-${i}`,
      sortOrder: i,
      categoryId: item.categoryId || categories[0]?.id || "",
      categoryLabel: category?.label || "",
      question: item.question || "",
      answer: item.answer || "",
    } satisfies FaqView;
  });
  return (
    <ShadcnFaq
      categories={categories}
      facebookUrl={facebookUrl}
      faqs={faqs}
      lead={asText(props.lead, "How to join, what to bring and how clock-in works,")}
      look={isFaqLook(props.look) ? props.look : "original"}
      rest={asText(props.rest) || undefined}
      showMore={{
        on: props.showMore === "on",
        first: [3, 4, 5, 6, 8].includes(Number(props.showMoreFirst)) ? Number(props.showMoreFirst) : 5,
        tone: stripTone(props.moreStrip),
      }}
      tones={{ search: stripTone(props.searchBar), open: props.openQuestion === "white" ? "white" : "grey" }}
      title={asText(props.title, "Frequently asked questions")}
    />
  );
}

export function HomeCtaBlock(props: Record<string, unknown>) {
  const { data, joinHref } = useSitePageLive();
  const look = isCtaLook(props.look) ? props.look : "original";
  if (look !== "original") {
    const cta = {
      title: asText(props.title, "Come for a walk this week"),
      guestBody: asText(props.guestBody, "Joining is free."),
      memberBody: asText(props.memberBody, "Your next walk is waiting."),
      members: `${number.format(data.members)} members`,
      joinHref,
    };
    return (
      <Section id="home-cta-heading">
        {look === "split" ? (
          <CtaSplitLook {...cta} />
        ) : look === "band" ? (
          <CtaBandLook {...cta} />
        ) : (
          <CtaNextLook {...cta} next={data.upcoming[0] ?? null} />
        )}
      </Section>
    );
  }
  return (
    <Section id="home-cta-heading">
      <div
        className="px-5 md:px-12 flex flex-col items-center relative isolate justify-center min-h-[29rem] sm:min-h-[30rem] md:min-h-[36rem] lg:min-h-[35rem] xl:min-h-[34rem] gap-8 pt-6 pb-8 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14 text-center"
        data-slot="hero"
      >
        {/* The moving letters behind it, as on the built-in homepage (home.tsx). */}
        <BandField heading="home-cta-heading" />
        <div className="flex max-w-2xl flex-col items-center gap-5 md:px-10">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
            <span className="font-medium">{number.format(data.members)} members</span>{" "}
            <span className="text-muted-foreground">and counting</span>
            <span aria-hidden="true" className="flex items-center gap-0.5 text-primary">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star className="size-3.5 fill-current" key={i} />
              ))}
            </span>
          </p>
          <h2
            className="text-balance font-semibold text-4xl leading-[1.05] tracking-tighter md:text-5xl lg:text-6xl"
            id="home-cta-heading"
          >
            {asText(props.title, "Come for a walk this week")}
          </h2>
          <p className="max-w-xl text-pretty text-muted-foreground md:text-lg">
            <span data-guest-home="">
              <span className="font-medium text-foreground">{asText(props.guestBody, "Joining is free.")}</span>
            </span>
            <span data-member-home="">
              <span className="font-medium text-foreground">{asText(props.memberBody, "Your next walk is waiting.")}</span>
            </span>
          </p>
          <Link className={`${BUTTON_PRIMARY} mt-4 h-12 gap-2 px-8 text-base`} data-guest-home="" href={joinHref}>
            Join the group
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
          <Link className={`${BUTTON_PRIMARY} mt-4 h-12 gap-2 px-8 text-base`} data-member-home="" href="/walks">
            See the walks
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </Section>
  );
}

const LEGAL_ICONS: ShadcnLegalIcon[] = ["about", "privacy", "terms", "how", "expect", "rules", "essentials", "charity"];

export function LegalHeroBlock(props: Record<string, unknown>) {
  const iconName = asText(props.icon);
  const icon = (LEGAL_ICONS.includes(iconName as ShadcnLegalIcon) ? iconName : "about") as ShadcnLegalIcon;
  const updated = asText(props.updated).trim();
  return (
    <ShadcnLegal
      current={asText(props.current, "/about")}
      docs={asText(props.docs, "legal") === "guide" ? "guide" : "legal"}
      heroOnly
      icon={icon}
      lead={asText(props.lead)}
      rest={asText(props.rest)}
      sections={[]}
      title={asText(props.title, "About")}
      updated={updated || null}
    />
  );
}

export function LegalSectionBlock(props: Record<string, unknown>) {
  const title = asText(props.title, "Section");
  const id = asText(props.id, title.toLowerCase().replace(/\s+/g, "-"));
  return (
    <Section id={`legal-${id}`}>
      <div
        className="px-5 md:px-12 grid gap-5 py-12 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10 md:py-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14"
        id={id}
      >
        <div className="flex flex-col gap-2 md:sticky md:top-[calc(var(--header-height)+2.5rem)] md:self-start">
          <h2 className="scroll-mt-(--header-height) text-balance font-semibold text-xl tracking-tight md:text-2xl" id={`legal-${id}`}>
            {title}
          </h2>
        </div>
        <div className="min-w-0 [&_.typeset-docs>:first-child]:mt-0">
          <div className="typeset typeset-docs w-full flex-1">
            <BodyText text={asText(props.body)} />
          </div>
        </div>
      </div>
    </Section>
  );
}

export function LegalClosingBlock(props: Record<string, unknown>) {
  const label = asText(props.buttonLabel).trim();
  const href = asText(props.buttonHref).trim();
  return (
    // The line across the top, with its + marks, as the Terms and Privacy pages' closing has.
    <div className="relative">
      <Guides />
      <div className="px-5 md:px-12 flex flex-col items-center gap-6 py-14 text-center md:py-20">
        <p className="max-w-2xl text-pretty text-muted-foreground md:text-lg">{asText(props.closing)}</p>
        {label && href ? (
          <SmartLink className={`${BUTTON_PRIMARY} gap-2`} href={href}>
            {label}
            <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </SmartLink>
        ) : (
          <Link className={BUTTON_OUTLINE} href="/contact">
            Ask a question
          </Link>
        )}
      </div>
    </div>
  );
}

/** A site page (/…) as a page link; any other address opens in a new tab. */
function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (href.startsWith("/")) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }
  return (
    <a className={className} href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  );
}

/** Charity of the Year on the homepage: words beside two big links (the CTA's split shape), or centred. */
export function HomeCharityBlock(props: Record<string, unknown>) {
  const eyebrow = asText(props.eyebrow, "Charity of the Year");
  const title = asText(props.title, "Shop online, raise money for free");
  const body = asText(
    props.text,
    "We’ve partnered with **easyfundraising**: thousands of shops donate to our Charity of the Year fund when you shop through it, at no extra cost to you.",
  );
  const buttonLabel = asText(props.buttonLabel, "Join our easyfundraising page");
  const buttonHref = asText(props.buttonHref, "https://www.easyfundraising.org.uk/causes/bury-steps-walking-group").trim();
  const moreLabel = asText(props.moreLabel, "How it works");
  const moreHref = asText(props.moreHref, "/charity-of-the-year").trim();
  const centred = props.look === "centred";
  const heading = (
    <>
      <p className="flex items-center gap-2 font-medium text-sm">
        <HandHeart aria-hidden className="size-4 text-muted-foreground" />
        {eyebrow}
      </p>
      <h2 className="text-balance font-semibold text-3xl leading-[1.1] tracking-tighter md:text-4xl" id="home-charity-heading">
        {title}
      </h2>
      <div className="max-w-xl text-pretty text-muted-foreground md:text-lg [&_strong]:font-medium [&_strong]:text-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4">
        <BodyText text={body} />
      </div>
    </>
  );
  if (centred) {
    return (
      <Section id="home-charity-heading">
        <div className="px-5 md:px-12 flex flex-col items-center gap-4 py-14 text-center md:py-20">
          {heading}
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {buttonLabel && buttonHref ? (
              <SmartLink className={`${BUTTON_PRIMARY} gap-2`} href={buttonHref}>
                {buttonLabel}
                <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
              </SmartLink>
            ) : null}
            {moreLabel && moreHref ? (
              <SmartLink className={BUTTON_OUTLINE} href={moreHref}>
                {moreLabel}
              </SmartLink>
            ) : null}
          </div>
        </div>
      </Section>
    );
  }
  const row = "px-5 md:px-12 flex flex-1 items-center justify-between gap-4 py-7 font-semibold text-lg lg:px-10";
  return (
    <Section id="home-charity-heading">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="px-5 md:px-12 flex flex-col justify-center gap-4 border-b py-14 lg:border-e lg:border-b-0 lg:py-20">{heading}</div>
        <div className="flex flex-col">
          {buttonLabel && buttonHref ? (
            <SmartLink className={`${row} bg-foreground text-background hover:bg-foreground/90`} href={buttonHref}>
              {buttonLabel}
              <ArrowRight aria-hidden className="size-5 shrink-0 rtl:rotate-180" />
            </SmartLink>
          ) : null}
          {buttonLabel && buttonHref && moreLabel && moreHref ? <span className="border-t" /> : null}
          {moreLabel && moreHref ? (
            <SmartLink className={`${row} hover:bg-muted/50`} href={moreHref}>
              {moreLabel}
              <ArrowRight aria-hidden className="size-5 shrink-0 rtl:rotate-180" />
            </SmartLink>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

export function WalkEssentialsListBlock(props: Record<string, unknown>) {
  const { walkEssentials } = useSitePageLive();
  const title = asText(props.title, "On each walk’s page");
  const id = "essentials";
  const after = asText(props.after);
  return (
    <Section id={`legal-${id}`}>
      <div
        className="px-5 md:px-12 grid gap-5 py-12 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-10 md:py-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14"
        id={id}
      >
        <div className="flex flex-col gap-2 md:sticky md:top-[calc(var(--header-height)+2.5rem)] md:self-start">
          <h2 className="scroll-mt-(--header-height) text-balance font-semibold text-xl tracking-tight md:text-2xl" id={`legal-${id}`}>
            {title}
          </h2>
        </div>
        <div className="min-w-0 [&_.typeset-docs>:first-child]:mt-0">
          <div className="typeset typeset-docs w-full flex-1">
            <ul className="list-none ps-0 [&>li]:ps-0 [&>li]:before:hidden [&>li]:marker:content-none">
              {walkEssentials.map((item) => (
                <li key={item.key}>
                  <span className="inline-flex items-center gap-2">
                    {createElement(essentialIcon(item.icon), { "aria-hidden": true, className: "size-4 shrink-0" })}
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            {after ? <BodyText text={after} /> : null}
          </div>
        </div>
      </div>
    </Section>
  );
}

export function ContactHeroBlock(props: Record<string, unknown>) {
  const { facebookUrl } = useSitePageLive();
  const showFacebook = asText(props.showFacebook, "show") !== "hide" && Boolean(facebookUrl);
  return (
    <section aria-labelledby="contact-heading" className="border-t first-of-type:border-t-0">
      <div className="px-5 md:px-12 flex flex-col gap-5 pb-8 md:flex-row md:items-end md:justify-between md:gap-8 md:pb-10 pt-8 md:pt-10">
        <div className="flex flex-col max-w-2xl gap-3 lg:gap-4">
          <p className="font-medium font-mono text-muted-foreground text-xs uppercase leading-4 tracking-widest">
            {asText(props.eyebrow, "Help")}
          </p>
          <h1 className="text-balance font-semibold text-3xl tracking-tighter md:text-4xl" id="contact-heading">
            {asText(props.title, "Contact us")}
          </h1>
          <p className="text-pretty text-muted-foreground md:text-lg">{asText(props.intro)}</p>
        </div>
        {showFacebook ? (
          <div className="flex shrink-0 gap-2">
            <a className={BUTTON_OUTLINE} href={facebookUrl} rel="noopener noreferrer" target="_blank">
              Ask on Facebook
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ContactFormBlock(props: Record<string, unknown>) {
  const steps = asItems(props.steps).map((item) => item.title).filter(Boolean);
  return (
    <ShadcnContactForm
      steps={
        steps.length > 0
          ? steps
          : [
              "Tell us who you are, so we know who to reply to.",
              "Ask anything: joining, a walk, or something else.",
              "An organiser reads it and gets back to you, usually within a few days.",
            ]
      }
    />
  );
}

export function AppsHeroBlock(props: Record<string, unknown>) {
  return (
    <HeroCopy eyebrow={asText(props.eyebrow, "Free to download")} title={asText(props.title, "Apps for our walks")} titleAs="h1">
      <p>{asText(props.intro)}</p>
    </HeroCopy>
  );
}

export function AppsCardBlock(props: Record<string, unknown>) {
  const name = asText(props.name, "App");
  const uses = asItems(props.uses).map((item) => item.title).filter(Boolean);
  const Icon = name.toLowerCase().includes("hii") ? Mountain : MapPin;
  return (
    <section>
      <div className="relative w-full">
        <DecorIcon className="size-4" position="bottom-left" />
        <article className="flex flex-col gap-6 bg-background p-6 sm:p-8 lg:p-10 border-t">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border bg-muted/40">
              <Icon aria-hidden className="size-8" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{name}</h2>
              <p className="text-sm font-medium text-muted-foreground">{asText(props.tagline)}</p>
            </div>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground">{asText(props.description)}</p>
          <ul className="flex flex-col gap-2.5">
            {uses.map((use) => (
              <li className="flex items-start gap-2.5 text-base text-foreground" key={use}>
                <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                {use}
              </li>
            ))}
          </ul>
          <div className="mt-auto grid gap-3 pt-2 sm:grid-cols-2">
            <Button asChild size="lg">
              <a aria-label={`Get ${name} on the App Store`} href={asText(props.appStore)} rel="noopener noreferrer" target="_blank">
                <Apple data-icon="inline-start" />
                App Store
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a aria-label={`Get ${name} on Google Play`} href={asText(props.googlePlay)} rel="noopener noreferrer" target="_blank">
                <Play data-icon="inline-start" />
                Google Play
              </a>
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
