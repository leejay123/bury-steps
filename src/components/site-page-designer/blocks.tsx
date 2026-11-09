"use client";

import { Fragment, createElement } from "react";
import { IntentLink as Link } from "@/components/intent-link";
import {
  Apple,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  Footprints,
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
import { DEFAULT_HOW_THIS_STARTED_EYEBROW } from "@/lib/homepage-copy";
import { ShadcnLegal, type ShadcnLegalIcon } from "@/components/shadcnio/legal";
import { ShadcnContactForm } from "@/app/(site)/contact/contact-form";
import {
  BUTTON_OUTLINE,
  BUTTON_PRIMARY,
  MiniNote,
  MiniWalk,
  PillLink,
  Section,
  SectionHead,
  Tile,
  WALKS_GRID,
} from "@/components/shadcnio/parts";
import { HeroField } from "@/components/shadcnio/ascii-field";
import { MoreRows, stripTone } from "@/components/shadcnio/more-rows";
import { GALLERY_GRID_3, PHONE_LIST } from "@/components/shadcnio/grids";
import { SectionTitle } from "@/components/section-title";
import { Button } from "@/components/ui/button";
import { HeroCopy } from "@/components/hero-copy";
import { DecorIcon } from "@/components/decor-icon";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import type { TestimonialView } from "@/lib/testimonials";
import { essentialIcon } from "@/lib/walk-essentials";
import { BodyText } from "./body-text";
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

export function HomeHeroBlock(props: Record<string, unknown>) {
  const { data, logo, joinHref } = useSitePageLive();
  const places = [
    "Bury",
    ...data.places
      .map((place) => tidyPlace(place.name))
      .filter((name) => name.length >= 3 && name.length <= 14 && !/^(bury|test)\b/i.test(name) && /[aeiou]/i.test(name)),
  ]
    .filter((name, i, all) => all.indexOf(name) === i)
    .slice(0, 4);
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                className="me-[0.18em] inline-block size-[0.82em] -translate-y-[0.05em] rounded-full border border-foreground/[0.12] object-contain bg-background align-middle"
                height={96}
                src={logo.src}
                width={96}
              />
              {asText(props.headingWord, "walking")}
            </span>{" "}
            {asText(props.headingAfter, "group")}
            <br className="max-sm:hidden" /> {asText(props.headingRest, "all of Bury steps out with.")}
          </h1>
          <p className="max-w-2xl text-muted-foreground sm:text-lg md:text-xl text-balance">
            <span className="font-medium text-foreground">
              {number.format(data.upcomingCount)} upcoming walks, {number.format(data.members)} members and{" "}
              {number.format(data.walksThisYear)} walks so far
            </span>{" "}
            around{" "}
            {places.map((place, i) => (
              <Fragment key={place}>
                <span className="whitespace-nowrap font-medium text-foreground">
                  <MapPin aria-hidden className="inline-block shrink-0 align-middle me-1 size-[1.05em] -translate-y-[0.1em]" />
                  {place}
                </span>
                {i < places.length - 2 ? ", " : i === places.length - 2 ? " and " : ""}
              </Fragment>
            ))}
            .{" "}
            <span data-guest-home="">{asText(props.guestClose, "Join for free, and clock in on the day of the walk.")}</span>
            <span data-member-home="">{asText(props.memberClose, "Pick your next walk, and clock in when you get there.")}</span>
          </p>
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

/** A designer switch: on unless it's been turned off (so pages saved before it keep it on). */
const isOn = (value: unknown) => value !== "off";

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
  return (
    <Section id="home-walks-heading">
      <SectionHead
        action={{ href: "/walks", label: "See all walks" }}
        id="home-walks-heading"
        lead={`${number.format(data.upcomingCount)} walks on the calendar,`}
        rest={asText(
          props.rest,
          "each one led by a volunteer walk leader, with the meeting point, distance and grade. Members see every detail and clock in on the day.",
        )}
        title={asText(props.title, "Walks coming up, every week")}
      />
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
    </Section>
  );
}

export function HomeExpectBlock(props: Record<string, unknown>) {
  const items = asItems(props.items).slice(0, 6);
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
  return (
    <Section id="home-cta-heading">
      <div
        className="px-5 md:px-12 flex flex-col items-center relative isolate justify-center min-h-[29rem] sm:min-h-[30rem] md:min-h-[36rem] lg:min-h-[35rem] xl:min-h-[34rem] gap-8 pt-6 pb-8 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14 text-center"
        data-slot="hero"
      >
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

const LEGAL_ICONS: ShadcnLegalIcon[] = ["about", "privacy", "terms", "how", "expect", "rules", "essentials"];

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
  return (
    <div className="px-5 md:px-12 flex flex-col items-center gap-6 py-14 text-center md:py-20">
      <p className="max-w-2xl text-pretty text-muted-foreground md:text-lg">{asText(props.closing)}</p>
      <Link className={BUTTON_OUTLINE} href="/contact">
        Ask a question
      </Link>
    </div>
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
