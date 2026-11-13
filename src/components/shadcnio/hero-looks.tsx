"use client";

import { useEffect, useId, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { IntentLink as Link } from "@/components/intent-link";
import { cn } from "@/lib/utils";
import type { HomeWalk } from "./home-data";
import { BUTTON_OUTLINE, BUTTON_PRIMARY } from "./parts";

/**
 * More looks for the homepage hero (chosen in the page designer), edge to edge
 * like the rest. Each has something that moves (dots, a route, the group
 * walking…), which the block's "Moving background" switch turns off; it also
 * stays still for anyone whose device asks for less motion. The movement is in
 * shadcnio.css (the `hero-*` rules), under `[data-hero-moving]`.
 */
export const HERO_LOOKS = [
  "original",
  "dots",
  "split",
  "stats",
  "route",
  "words",
  "pins",
  "steps",
  "bento",
  "bands",
  "list",
  "trail",
  "week",
  "group",
  "countryside",
] as const;
export type HeroLook = (typeof HERO_LOOKS)[number];
export const isHeroLook = (v: unknown): v is HeroLook => HERO_LOOKS.includes(v as HeroLook);

export type HeroLookProps = {
  look: Exclude<HeroLook, "original">;
  moving: boolean;
  kicker: string;
  heading: { before: string; word: string; after: string; rest: string };
  logoSrc: string;
  /** The numbers sentence with the visitor / member line, as the original hero words it. */
  sentence: ReactNode;
  counts: { upcoming: number; members: number; walks: number };
  /** Up to four short place names (the map pins). */
  places: string[];
  /** Every place the group walks (the scrolling strip). */
  everyPlace: string[];
  walks: HomeWalk[];
  joinHref: string;
  /** Changing word: the words before it, and the words it changes between. */
  wordsLead: string;
  words: string[];
  /** Boxes: the fourth box. */
  boxTitle: string;
  boxText: string;
  trailNote: ReactNode;
  groupNote: ReactNode;
};

const ID = "home-heading";
const PAD = "px-5 md:px-12";
/** As tall as the original hero. */
const TALL = "min-h-[29rem] sm:min-h-[30rem] md:min-h-[36rem] lg:min-h-[35rem] xl:min-h-[34rem]";
/** Side-by-side looks: only as tall as the original once the two halves sit beside each other. */
const TALL_WIDE = "lg:min-h-[35rem] xl:min-h-[34rem]";
const BIG = "text-4xl sm:text-5xl md:text-6xl lg:text-7xl";
const HEAD = "border-b px-5 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider md:px-8";

const TZ = "Europe/London";
const number = new Intl.NumberFormat("en-GB");
const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: TZ });
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: TZ });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: TZ });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: TZ });
const MONTH_LONG = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: TZ });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
/** A day in Bury as 2026-11-15, to match walks to days. */
const DAY_KEY = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ });
const UTC_DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const UTC_FULL = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

// ── Shared pieces ───────────────────────────────────────────────────────────

function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-muted-foreground text-xs leading-4", className)} data-slot="docs-affiliation">
      {children}
    </p>
  );
}

/** "The (logo) walking group", as the original hero's first line. */
function HeadingStart({ heading, logoSrc }: Pick<HeroLookProps, "heading" | "logoSrc">) {
  return (
    <>
      {heading.before}{" "}
      <span className="whitespace-nowrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="me-[0.18em] inline-block size-[0.82em] -translate-y-[0.05em] rounded-full border border-foreground/[0.12] object-contain bg-background align-middle"
          height={96}
          src={logoSrc}
          width={96}
        />
        {heading.word}
      </span>{" "}
      {heading.after}
    </>
  );
}

function Heading({
  heading,
  logoSrc,
  className,
  twoLines,
}: Pick<HeroLookProps, "heading" | "logoSrc"> & { className?: string; twoLines?: boolean }) {
  return (
    <h1 className={cn("text-balance font-semibold leading-[1.05] tracking-tighter", className)} id={ID}>
      <HeadingStart heading={heading} logoSrc={logoSrc} />
      {twoLines ? <br className="max-sm:hidden" /> : null} {heading.rest}
    </h1>
  );
}

/** The round buttons, as the original hero: join (or the dashboard, signed in) and the walks. */
function Buttons({ joinHref, className }: { joinHref: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
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
  );
}

const BAR = "flex min-h-16 items-center justify-between gap-3 px-5 font-semibold md:px-8 md:text-lg";
const BAR_DARK = "bg-foreground text-background hover:bg-foreground/90";

/** The same two buttons as a full-width bar split in half (put inside a two-column grid). */
function BarLinks({ joinHref, edge }: { joinHref: string; edge?: boolean }) {
  const arrow = <ArrowRight aria-hidden className="size-5 shrink-0 rtl:rotate-180" />;
  // At the page's left edge the words start where the heading above them does.
  const first = cn(BAR, BAR_DARK, edge && "md:ps-12");
  return (
    <>
      <Link className={first} data-guest-home="" href={joinHref}>
        Join the group {arrow}
      </Link>
      <Link className={first} data-member-home="" href="/overview">
        Your dashboard {arrow}
      </Link>
      <Link className={cn(BAR, "hover:bg-muted/40")} href="/walks">
        See the walks {arrow}
      </Link>
    </>
  );
}

/** Centred words, sized as the original hero. */
function Centre({ p, sentence = true }: { p: HeroLookProps; sentence?: boolean }) {
  return (
    <div className="mx-auto flex min-w-0 max-w-5xl flex-col items-center gap-4 text-center md:gap-5">
      <Kicker className="mb-1 text-center md:mb-2">{p.kicker}</Kicker>
      <Heading className={BIG} heading={p.heading} logoSrc={p.logoSrc} twoLines />
      {sentence ? <p className="max-w-2xl text-balance text-muted-foreground sm:text-lg md:text-xl">{p.sentence}</p> : null}
    </div>
  );
}

/** Words on the left (beside a panel, or over a drawing). */
function Side({ p, className }: { p: HeroLookProps; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col justify-center gap-5", className)}>
      <Kicker>{p.kicker}</Kicker>
      <Heading className="text-4xl sm:text-5xl lg:text-6xl" heading={p.heading} logoSrc={p.logoSrc} />
      <p className="max-w-xl text-pretty text-muted-foreground sm:text-lg">{p.sentence}</p>
      <Buttons joinHref={p.joinHref} />
    </div>
  );
}

function countLabels(counts: HeroLookProps["counts"], year = false) {
  return [
    { value: counts.upcoming, label: plural(counts.upcoming, "upcoming walk", "upcoming walks") },
    { value: counts.members, label: plural(counts.members, "member", "members") },
    {
      value: counts.walks,
      label: `${plural(counts.walks, "walk", "walks")} so far${year ? " this year" : ""}`,
    },
  ];
}

const walkWhen = (walk: HomeWalk) => {
  if (!walk.startsAt) return walk.when;
  const at = new Date(walk.startsAt);
  return `${DAY.format(at)} ${DATE.format(at)} ${MONTH.format(at)} · ${TIME.format(at)}`;
};

// ── A: centred, drifting dots ───────────────────────────────────────────────

function DotsLook(p: HeroLookProps) {
  return (
    <div
      className={cn(
        PAD,
        TALL,
        "relative isolate flex flex-col items-center justify-center gap-8 overflow-hidden pt-6 pb-8 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14",
      )}
    >
      <div aria-hidden className="hero-dots absolute inset-0 -z-10" />
      <div aria-hidden className="hero-dots-fade absolute inset-0 -z-10" />
      <Centre p={p} />
      <Buttons className="justify-center" joinHref={p.joinHref} />
    </div>
  );
}

// ── B: words beside the next walk, moving contour lines ─────────────────────

function NextWalkPanel({ walk }: { walk: HomeWalk | undefined }) {
  const frame = "flex flex-col border-t lg:border-s lg:border-t-0";
  if (!walk) {
    return (
      <div className={frame}>
        <p className={HEAD}>Next walk</p>
        <p className="flex flex-1 items-center justify-center bg-muted/30 px-5 py-10 text-center text-muted-foreground">
          No walks on the calendar yet.
        </p>
      </div>
    );
  }
  const at = walk.startsAt ? new Date(walk.startsAt) : null;
  const facts = [
    { label: "Distance", value: walk.distance },
    { label: "Grade", value: walk.grade },
  ].filter((fact) => fact.value);
  return (
    <div className={frame}>
      <p className={HEAD}>Next walk</p>
      <div className="flex flex-1 flex-col gap-2 bg-muted/30 px-5 py-8 md:px-8">
        {at ? (
          <>
            <strong className="font-semibold text-6xl leading-none tracking-tighter tabular-nums">{DATE.format(at)}</strong>
            <span className="font-semibold text-muted-foreground text-sm uppercase">
              {WEEKDAY.format(at)} · {MONTH_LONG.format(at)} · {TIME.format(at)}
            </span>
          </>
        ) : (
          <span className="font-semibold text-muted-foreground text-sm uppercase">{walk.when}</span>
        )}
        <strong className="mt-3 text-balance font-semibold text-2xl leading-tight tracking-tight">{walk.title}</strong>
      </div>
      {facts.length > 0 ? (
        <div className={cn("grid border-t", facts.length === 2 && "grid-cols-2")}>
          {facts.map((fact, i) => (
            <span className={cn("flex flex-col gap-0.5 px-5 py-4 md:px-8", i > 0 && "border-s")} key={fact.label}>
              <small className="text-muted-foreground text-xs">{fact.label}</small>
              <strong className="font-semibold">{fact.value}</strong>
            </span>
          ))}
        </div>
      ) : null}
      <Link className="flex min-h-16 items-center justify-between gap-3 border-t px-5 font-semibold hover:bg-muted/40 md:px-8" href={walk.href}>
        See the walk <ArrowRight aria-hidden className="size-5 shrink-0 rtl:rotate-180" />
      </Link>
    </div>
  );
}

function SplitLook(p: HeroLookProps) {
  return (
    <div className={cn("grid lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]", TALL_WIDE)}>
      <div className={cn(PAD, "relative isolate flex overflow-hidden py-12 md:py-16")}>
        <svg
          aria-hidden
          className="hero-lines absolute top-0 left-0 -z-10 h-full w-[75rem] max-w-none text-foreground/10"
          fill="none"
          preserveAspectRatio="none"
          stroke="currentColor"
          strokeWidth="1.2"
          viewBox="0 0 1200 640"
        >
          <path d="M0 520 C200 470 360 560 560 500 S900 420 1200 480" />
          <path d="M0 470 C200 420 360 510 560 450 S900 370 1200 430" />
          <path d="M0 420 C200 370 360 460 560 400 S900 320 1200 380" />
          <path d="M0 370 C200 320 360 410 560 350 S900 270 1200 330" />
          <path d="M0 120 C220 160 380 80 600 130 S940 190 1200 120" />
          <path d="M0 80 C220 120 380 40 600 90 S940 150 1200 80" />
        </svg>
        <Side p={p} />
      </div>
      <NextWalkPanel walk={p.walks[0]} />
    </div>
  );
}

// ── C: big numbers row, places scrolling ────────────────────────────────────

function PlacesStrip({ places }: { places: string[] }) {
  if (places.length === 0) return null;
  // Enough names to fill a wide screen, then the lot twice so the loop has no seam.
  const filled = Array.from({ length: Math.ceil(10 / places.length) }, () => places).flat();
  return (
    <div className="flex h-14 items-center overflow-hidden border-t bg-muted/30">
      <p className="sr-only">Where we walk: {places.join(", ")}.</p>
      <div aria-hidden className="hero-marquee flex w-max shrink-0 whitespace-nowrap font-medium text-muted-foreground text-sm md:text-base">
        {[0, 1].map((copy) => (
          <span className="flex shrink-0" key={copy}>
            {filled.map((name, i) => (
              <span className="flex items-center" key={i}>
                <span className="px-5">{name}</span>
                <span>·</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatsLook(p: HeroLookProps) {
  return (
    <div className={cn("flex flex-col", TALL)}>
      <div className={cn(PAD, "flex flex-1 flex-col justify-center gap-5 py-12")}>
        <Kicker>{p.kicker}</Kicker>
        <Heading className={cn(BIG, "max-w-4xl")} heading={p.heading} logoSrc={p.logoSrc} />
        <Buttons joinHref={p.joinHref} />
      </div>
      <dl className="grid grid-cols-3 border-t">
        {countLabels(p.counts, true).map((count, i) => (
          <div
            className={cn(
              "flex flex-col-reverse justify-end gap-1 px-4 py-5 md:px-8 lg:flex-row-reverse lg:items-baseline lg:justify-end lg:gap-3 lg:py-6",
              i === 0 ? "md:ps-12" : "border-s",
            )}
            key={count.label}
          >
            <dt className="text-muted-foreground text-sm md:text-base">{count.label}</dt>
            <dd className="font-semibold text-4xl leading-none tracking-tighter tabular-nums md:text-5xl lg:text-6xl">
              {number.format(count.value)}
            </dd>
          </div>
        ))}
      </dl>
      <PlacesStrip places={p.everyPlace} />
    </div>
  );
}

// ── D: a route drawing itself ───────────────────────────────────────────────

const ROUTE = "M640 560 C720 470 820 520 880 430 S980 280 1060 300 S1180 220 1200 120";

function RouteLook(p: HeroLookProps) {
  const mask = `hero-route-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div className={cn(PAD, TALL, "relative isolate flex items-center overflow-hidden py-12 md:py-16")}>
      <svg
        aria-hidden
        className="absolute inset-0 -z-10 size-full text-foreground max-lg:opacity-15"
        fill="none"
        preserveAspectRatio="xMaxYMid slice"
        viewBox="0 0 1280 640"
      >
        {/* The dotted route shows through a line that draws itself over it. */}
        <mask id={mask} maskUnits="userSpaceOnUse">
          <path className="hero-route" d={ROUTE} pathLength={1} stroke="white" strokeLinecap="round" strokeWidth="10" />
        </mask>
        <path d={ROUTE} mask={`url(#${mask})`} stroke="currentColor" strokeDasharray="2 10" strokeLinecap="round" strokeWidth="3" />
        <circle cx="640" cy="560" fill="currentColor" r="7" />
        <circle cx="1200" cy="120" r="7" stroke="currentColor" strokeWidth="3" />
      </svg>
      <Side className="lg:max-w-xl" p={p} />
    </div>
  );
}

// ── E: changing word in the heading ─────────────────────────────────────────

/** One word at a time, rolling up to the next every few seconds. */
function WordWheel({ words, moving }: { words: string[]; moving: boolean }) {
  const [at, setAt] = useState(0);
  const [snap, setSnap] = useState(false);
  const rolls = moving && words.length > 1;
  useEffect(() => {
    if (!rolls || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setSnap(false);
      setAt((n) => (n >= words.length ? 1 : n + 1));
    }, 2500);
    return () => window.clearInterval(id);
  }, [rolls, words.length]);
  // The first word again at the end, so the roll only ever goes up; then it jumps back unseen.
  const list = rolls ? [...words, words[0]!] : words.slice(0, 1);
  const shown = rolls ? Math.min(at, words.length) : 0;
  return (
    <>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden className="inline-block h-[1.2em] overflow-hidden align-bottom text-muted-foreground leading-[1.2]">
        <span
          className={cn("flex flex-col", !snap && "transition-transform duration-700 ease-[cubic-bezier(.7,0,.3,1)]")}
          onTransitionEnd={() => {
            if (at < words.length) return;
            setSnap(true);
            setAt(0);
          }}
          style={{ transform: `translateY(-${shown * 1.2}em)` }}
        >
          {list.map((word, i) => (
            <span className="h-[1.2em] whitespace-nowrap" key={i}>
              {word}
            </span>
          ))}
        </span>
      </span>
    </>
  );
}

function WordsLook(p: HeroLookProps) {
  return (
    <div className={cn("flex flex-col", TALL)}>
      <div className={cn(PAD, "flex flex-1 flex-col justify-center gap-6 py-12")}>
        <Kicker>{p.kicker}</Kicker>
        <h1 className="font-semibold text-5xl leading-[1.1] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl" id={ID}>
          {p.wordsLead}
          <br />
          <WordWheel moving={p.moving} words={p.words} />
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground sm:text-lg">{p.sentence}</p>
      </div>
      <div className="grid grid-cols-2 border-t">
        <BarLinks edge joinHref={p.joinHref} />
      </div>
    </div>
  );
}

// ── F: map grid with pulsing pins ───────────────────────────────────────────

const PINS = [
  { left: "22%", top: "30%" },
  { left: "52%", top: "52%" },
  { left: "30%", top: "74%" },
  { left: "50%", top: "14%" },
];

function PinsLook(p: HeroLookProps) {
  return (
    <div className={cn("grid lg:grid-cols-2", TALL_WIDE)}>
      <Side className={cn(PAD, "py-12 md:py-16")} p={p} />
      <div
        aria-label={`Where we walk: ${p.places.join(", ")}`}
        className="hero-map relative min-h-72 border-t bg-muted/30 lg:border-s lg:border-t-0"
        role="img"
      >
        {p.places.slice(0, PINS.length).map((place, i) => (
          <div aria-hidden className="absolute flex items-center gap-2.5" key={place} style={PINS[i]}>
            <span className="relative size-3.5 shrink-0">
              <span className="hero-ring absolute inset-0 rounded-full bg-foreground" style={{ animationDelay: `${i * 0.8}s` }} />
              <span className="absolute inset-0 rounded-full border-[3px] border-background bg-foreground" />
            </span>
            <span className="whitespace-nowrap border bg-background px-2.5 py-1 font-semibold text-sm">{place}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── G: footsteps across the page ────────────────────────────────────────────

const FOOT_LEFT = (
  <>
    <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
    <path d="M4 13h4" />
  </>
);
const FOOT_RIGHT = (
  <>
    <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
    <path d="M16 17h4" />
  </>
);

function StepsLook(p: HeroLookProps) {
  return (
    <div
      className={cn(
        PAD,
        TALL,
        "relative isolate flex flex-col items-center justify-center gap-8 overflow-hidden pt-6 pb-28 sm:pt-8 md:pt-10 md:pb-32",
      )}
    >
      <div aria-hidden className="absolute inset-x-0 bottom-8 -z-10 flex justify-around px-6 md:bottom-12 md:px-10">
        {Array.from({ length: 8 }, (_, i) => (
          <svg
            className={cn("hero-step size-7 md:size-[1.875rem]", i % 2 === 1 && "-translate-y-6", i >= 5 && "max-sm:hidden")}
            fill="none"
            key={i}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            style={{ animationDelay: `${i * 0.4}s` }}
            viewBox="0 0 24 24"
          >
            {i % 2 === 1 ? FOOT_RIGHT : FOOT_LEFT}
          </svg>
        ))}
      </div>
      <Centre p={p} />
      <Buttons className="justify-center" joinHref={p.joinHref} />
    </div>
  );
}

// ── I: boxes ────────────────────────────────────────────────────────────────

function BentoLook(p: HeroLookProps) {
  const box = "flex min-h-28 flex-col justify-end gap-1 px-5 py-5 md:px-8 lg:min-h-36";
  // Two by two on a phone, four in a row on a wide screen: lines between, none doubled.
  const lines = (i: number) =>
    cn(
      i % 2 === 1 && "border-s",
      i >= 2 && "max-lg:border-t",
      i === 2 && "lg:border-s",
      // The boxes on the left edge start where the heading does.
      i === 0 && "md:ps-12",
      i === 2 && "md:max-lg:ps-12",
    );
  return (
    <div className={cn("flex flex-col", TALL)}>
      <div className={cn(PAD, "relative flex flex-1 flex-col justify-center gap-4 overflow-hidden py-12")}>
        <div aria-hidden className="hero-shine absolute inset-x-0 top-0 h-0.5" />
        <Kicker>{p.kicker}</Kicker>
        <Heading className={BIG} heading={p.heading} logoSrc={p.logoSrc} />
      </div>
      <dl className="grid grid-cols-2 border-t lg:grid-cols-4">
        {countLabels(p.counts).map((count, i) => (
          <div className={cn(box, "flex-col-reverse justify-start", lines(i))} key={count.label}>
            <dt className="text-muted-foreground text-sm">{count.label}</dt>
            <dd className="font-semibold text-5xl leading-none tracking-tighter tabular-nums">{number.format(count.value)}</dd>
          </div>
        ))}
        <div className={cn(box, "flex-col-reverse justify-start bg-muted/30", lines(3))}>
          <dd className="text-muted-foreground text-sm">{p.boxText}</dd>
          <dt className="font-semibold text-xl">{p.boxTitle}</dt>
        </div>
      </dl>
      <div className="grid grid-cols-2 border-t">
        <BarLinks edge joinHref={p.joinHref} />
      </div>
    </div>
  );
}

// ── K: heading in three bands ───────────────────────────────────────────────

/** The second line of the heading cut into two even halves ("all of Bury" / "steps out with."). */
function halves(text: string): [string, string] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [words.join(" "), ""];
  let cut = 1;
  let gap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (diff < gap) {
      gap = diff;
      cut = i;
    }
  }
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

function BandsLook(p: HeroLookProps) {
  const [second, third] = halves(p.heading.rest);
  const band = "flex flex-1 items-center overflow-hidden px-5 py-5 md:px-12";
  return (
    <div className={cn("@container flex flex-col", TALL)}>
      <Kicker className={cn(PAD, "border-b py-3")}>{p.kicker}</Kicker>
      {/* Sized from the page column's own width, so the first line always fits its band. */}
      <h1 className="flex flex-1 flex-col font-semibold text-[clamp(1.75rem,7.4cqw,6rem)] leading-none tracking-tighter" id={ID}>
        <span className={band}>
          <span className="hero-band">
            <HeadingStart heading={p.heading} logoSrc={p.logoSrc} />
          </span>
        </span>{" "}
        {second ? (
          <span className={cn(band, "justify-end border-t bg-muted/30 text-end")}>
            <span className="hero-band hero-band-back">{second}</span>
          </span>
        ) : null}{" "}
        {third ? (
          <span className={cn(band, "border-t text-muted-foreground")}>
            <span className="hero-band hero-band-late">{third}</span>
          </span>
        ) : null}
      </h1>
      <div className="grid border-t lg:grid-cols-[minmax(0,1fr)_30rem]">
        <p className={cn(PAD, "flex items-center py-4 text-pretty text-muted-foreground")}>
          <span>{p.sentence}</span>
        </p>
        <div className="grid grid-cols-2 max-lg:border-t lg:border-s">
          <BarLinks joinHref={p.joinHref} />
        </div>
      </div>
    </div>
  );
}

// ── M: heading beside a rolling list of walks ───────────────────────────────

function WalkRow({ walk, className, hidden }: { walk: HomeWalk; className?: string; hidden?: boolean }) {
  return (
    <Link
      aria-hidden={hidden || undefined}
      className={cn("flex flex-col justify-center gap-1 px-5 py-5 hover:bg-muted/40 md:px-8", className)}
      href={walk.href}
      tabIndex={hidden ? -1 : undefined}
    >
      <small className="text-muted-foreground text-sm">{walkWhen(walk)}</small>
      <strong className="text-pretty font-semibold md:text-lg">{walk.title}</strong>
    </Link>
  );
}

function ListLook(p: HeroLookProps) {
  // Rolls when there are enough walks to fill the box; otherwise the walks sit still, sharing it.
  const rolls = p.moving && p.walks.length >= 4;
  return (
    <div className={cn("grid lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]", TALL_WIDE)}>
      <Side className={cn(PAD, "py-12 md:py-16")} p={p} />
      <div className="flex min-h-0 flex-col border-t lg:border-s lg:border-t-0">
        <p className={cn(HEAD, "flex justify-between gap-3")}>
          <span>Coming up</span>
          <span>
            {number.format(p.counts.upcoming)} {plural(p.counts.upcoming, "walk", "walks")}
          </span>
        </p>
        {p.walks.length === 0 ? (
          <p className="flex flex-1 items-center justify-center px-5 py-10 text-center text-muted-foreground">
            No walks on the calendar yet.
          </p>
        ) : rolls ? (
          <div className="relative h-80 overflow-hidden lg:h-auto lg:flex-1">
            <div className="hero-roll flex flex-col lg:absolute lg:inset-x-0 lg:top-0" style={{ animationDuration: `${p.walks.length * 5}s` }}>
              {p.walks.map((walk) => (
                <WalkRow className="border-b" key={walk.id} walk={walk} />
              ))}
              {p.walks.map((walk) => (
                <WalkRow className="border-b" hidden key={walk.id} walk={walk} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            {p.walks.slice(0, 4).map((walk, i) => (
              <WalkRow className={cn("flex-1", i > 0 && "border-t")} key={walk.id} walk={walk} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── N: a trail line with mile markers ───────────────────────────────────────

function TrailLook(p: HeroLookProps) {
  return (
    <div className={cn("flex flex-col", TALL)}>
      <div className={cn(PAD, "flex flex-1 flex-col items-center justify-center gap-8 py-12")}>
        <Centre p={p} sentence={false} />
        <Buttons className="justify-center" joinHref={p.joinHref} />
      </div>
      <div className="relative h-32 border-t bg-muted/30">
        <p className="absolute inset-x-5 top-3 text-end text-muted-foreground text-xs md:inset-x-12 md:text-sm">{p.trailNote}</p>
        <div aria-hidden className="absolute inset-x-5 top-9 md:inset-x-12">
          <div className="hero-trail">
            <div className="grid size-7 place-items-center rounded-full bg-foreground text-background">
              <svg className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="13" cy="4" r="2" />
                <path d="M9 20l3-6 3 3v4M8 11l3-3 4 2 3 2" />
              </svg>
            </div>
          </div>
        </div>
        <div aria-hidden className="absolute inset-x-5 top-[4.25rem] border-muted-foreground/50 border-t-2 border-dashed md:inset-x-12" />
        <div aria-hidden className="absolute inset-x-5 top-[5.25rem] flex justify-between font-semibold text-muted-foreground text-xs tabular-nums md:inset-x-12">
          <span>0 mi</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6 mi</span>
        </div>
      </div>
    </div>
  );
}

// ── O: this week along the bottom ───────────────────────────────────────────

const noChange = () => () => undefined;
/** Today in Bury (2026-11-15), known only in the browser: the saved page is shared by every day. */
function useToday(): string | null {
  return useSyncExternalStore(
    noChange,
    () => DAY_KEY.format(new Date()),
    () => null,
  );
}

/** Monday to Sunday of the week the next walk is in, each with its walks. */
function weekOf(walks: HomeWalk[]) {
  const dated = walks.filter((walk) => walk.startsAt);
  const first = dated[0];
  if (!first) return [];
  const [year, month, day] = DAY_KEY.format(new Date(first.startsAt!)).split("-").map(Number) as [number, number, number];
  const noon = new Date(Date.UTC(year, month - 1, day, 12));
  const monday = noon.getTime() - ((noon.getUTCDay() + 6) % 7) * 86_400_000;
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday + i * 86_400_000);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      date,
      walks: dated.filter((walk) => DAY_KEY.format(new Date(walk.startsAt!)) === key),
    };
  });
}

function WeekLook(p: HeroLookProps) {
  const today = useToday();
  const week = weekOf(p.walks);
  return (
    <div className={cn("flex flex-col", TALL)}>
      <div className={cn(PAD, "flex flex-1 flex-col justify-center gap-8 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-12")}>
        <div className="flex min-w-0 max-w-3xl flex-col gap-5">
          <Kicker>{p.kicker}</Kicker>
          <Heading className={BIG} heading={p.heading} logoSrc={p.logoSrc} />
        </div>
        <Buttons className="lg:w-60 lg:shrink-0 lg:flex-col lg:[&>a]:w-full" joinHref={p.joinHref} />
      </div>
      {week.length === 0 ? (
        <p className={cn(PAD, "border-t bg-muted/30 py-8 text-center text-muted-foreground")}>No walks on the calendar yet.</p>
      ) : (
        <ol className="grid grid-cols-7 border-t">
          {week.map((day, i) => {
            const isToday = today === day.key;
            const past = today !== null && day.key < today;
            const times = day.walks.map((walk) => TIME.format(new Date(walk.startsAt!)));
            const body = (
              <>
                <small className={cn("font-semibold text-[0.65rem] uppercase md:text-xs", isToday ? "text-foreground" : "text-muted-foreground")}>
                  {isToday ? "Today" : UTC_DAY.format(day.date)}
                </small>
                <strong className="font-semibold text-lg leading-tight tabular-nums md:text-2xl">{day.date.getUTCDate()}</strong>
                {day.walks.length > 0 ? (
                  <>
                    <span className="mt-auto pt-3 font-semibold text-xs md:text-sm">
                      {day.walks.length} {plural(day.walks.length, "walk", "walks")}
                    </span>
                    <span className="text-muted-foreground text-xs max-md:hidden">{times.join(" and ")}</span>
                  </>
                ) : isToday ? (
                  <span className="mt-auto pt-3 text-muted-foreground text-xs max-md:hidden md:text-sm">No walk today</span>
                ) : null}
              </>
            );
            const cell = cn(
              "flex h-full min-h-28 flex-col gap-0.5 px-2 py-3 md:min-h-40 md:px-5 md:py-4",
              past && "bg-muted/30",
              isToday && "hero-today",
            );
            return (
              <li aria-label={UTC_FULL.format(day.date)} className={cn(i > 0 ? "border-s" : "lg:[&>*]:ps-12")} key={day.key}>
                {day.walks.length > 0 ? (
                  <Link className={cn(cell, "hover:bg-muted/40")} href={day.walks.length === 1 ? day.walks[0]!.href : "/walks"}>
                    {body}
                  </Link>
                ) : (
                  <div className={cell}>{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ── Q: the group walking along the bottom ───────────────────────────────────

type WalkerProps = {
  x: number;
  y?: number;
  scale: number;
  /** How far into the step this walker starts (seconds), so they're not all in time. */
  delay: number;
  grey?: boolean;
  poles?: boolean;
  /** Holding a dog's lead: the front arm reaches out instead of swinging. */
  lead?: boolean;
};

function Walker({ x, y = 0, scale, delay, grey, poles, lead }: WalkerProps) {
  const style = { animationDelay: `-${delay}s` };
  const pole = <line strokeWidth="1.6" x1="0" x2="7" y1="22" y2="52" />;
  return (
    <g className={grey ? "text-muted-foreground/60" : "text-foreground"} stroke="currentColor" strokeWidth="2.4" transform={`translate(${x},${y}) scale(${scale})`}>
      <g className="hero-bob" style={style}>
        <circle cx="2" cy="-64" r="7.5" />
        <line x1="0" x2="0" y1="-55" y2="-30" />
        <g transform="translate(0,-30)">
          <line className="hero-lf" style={style} x1="0" x2="0" y1="0" y2="30" />
          <line className="hero-lb" style={style} x1="0" x2="0" y1="0" y2="30" />
        </g>
        <g transform="translate(0,-52)">
          {lead ? (
            <line x1="0" x2="14" y1="0" y2="16" />
          ) : (
            <g className="hero-af" style={style}>
              <line x1="0" x2="0" y1="0" y2="22" />
              {poles ? pole : null}
            </g>
          )}
          <g className="hero-ab" style={style}>
            <line x1="0" x2="0" y1="0" y2="22" />
            {poles ? pole : null}
          </g>
        </g>
        {lead ? <path d="M14 -36 Q 30 -14 46 -18" strokeWidth="1.2" /> : null}
      </g>
    </g>
  );
}

function Dog({ x }: { x: number }) {
  return (
    <g className="text-foreground" stroke="currentColor" strokeWidth="2.2" transform={`translate(${x},0)`}>
      <line x1="-12" x2="12" y1="-15" y2="-15" />
      <circle cx="16" cy="-20" r="4.5" />
      <line x1="19" x2="21" y1="-25" y2="-29" />
      <g transform="translate(-12,-15)">
        <line className="hero-tail" x1="0" x2="-8" y1="0" y2="-7" />
      </g>
      <g transform="translate(-9,-15)">
        <line className="hero-lf hero-dogleg" x1="0" x2="0" y1="0" y2="15" />
        <line className="hero-lb hero-dogleg" x1="0" x2="0" y1="0" y2="15" />
      </g>
      <g transform="translate(9,-15)">
        <line className="hero-lb hero-dogleg" x1="0" x2="0" y1="0" y2="15" />
        <line className="hero-lf hero-dogleg" x1="0" x2="0" y1="0" y2="15" />
      </g>
    </g>
  );
}

/** Six walkers in the site's thin lines: one with poles, one with a dog, two chatting, two further back. */
function WalkingGroup() {
  return (
    <svg className="h-[170px] w-[440px] shrink-0 overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 440 170">
      <g transform="translate(0,138)">
        <Walker delay={0.4} grey scale={0.82} x={330} y={-6} />
        <Walker delay={0} poles scale={1.06} x={400} />
        <g className="hero-s2">
          <Walker delay={0.2} scale={0.96} x={300} />
          <Walker delay={0.7} scale={0.9} x={270} />
          <g className="hero-chat text-foreground" stroke="currentColor" strokeWidth="1.5" transform="translate(272,-104)">
            <path className="fill-background" d="M0 0h30a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H12l-6 6v-6H0a6 6 0 0 1-6-6V6A6 6 0 0 1 0 0z" />
            <circle cx="7" cy="10" fill="currentColor" r="1.4" stroke="none" />
            <circle cx="15" cy="10" fill="currentColor" r="1.4" stroke="none" />
            <circle cx="23" cy="10" fill="currentColor" r="1.4" stroke="none" />
          </g>
        </g>
        <g className="hero-s1">
          <Walker delay={0.55} lead scale={1} x={180} />
          <Dog x={232} />
        </g>
        <Walker delay={0.9} grey scale={0.86} x={90} y={-4} />
        <Walker delay={0.3} scale={1.02} x={30} />
      </g>
    </svg>
  );
}

function GroupLook(p: HeroLookProps) {
  return (
    <div className={cn("flex flex-col", TALL)}>
      <div className={cn(PAD, "flex flex-1 flex-col items-center justify-center gap-8 py-12")}>
        <Centre p={p} />
        <Buttons className="justify-center" joinHref={p.joinHref} />
      </div>
      <div className="relative h-[170px] overflow-hidden border-t bg-muted/30">
        <p className="absolute inset-x-5 top-3 text-end text-muted-foreground text-xs md:inset-x-12 md:text-sm">{p.groupNote}</p>
        <div aria-hidden className="absolute inset-x-0 top-[138px] border-foreground/20 border-t-2 border-dotted" />
        <div aria-hidden className="hero-march">
          <WalkingGroup />
        </div>
        {/* A second group half a lap behind, so the strip is never empty while it moves. */}
        <div aria-hidden className="hero-march hero-march-2">
          <WalkingGroup />
        </div>
      </div>
    </div>
  );
}

// ── R: out in the countryside, the scenery rolling by ───────────────────────

/** The scene is 270 tall. Its drawings keep the numbers they were drawn with: the top is 370, the ground 596. */
const SCENE_TOP = 370;
const GROUND = 596;
const FAR_HILLS = "M0 484C80 454 150 434 230 444S380 484 460 464S600 394 700 406S860 466 950 454S1100 414 1180 444S1240 499 1280 484";
const MID_HILLS = "M0 534C100 514 200 500 320 510S520 550 640 536S860 492 980 506S1180 554 1280 534";
const CLOUD = "M0 0a13 13 0 0 1 24 -9a17 17 0 0 1 32 3a12 12 0 0 1 4 23h-58a9 9 0 0 1 -2 -17z";
const TUFT = "M0 0q-1 -7 -4 -9M1 0q0 -8 2 -11M2 0q2 -6 6 -7";
const ROCK = "M0 0q2 -8 9 -7q7 1 8 7z";
const BIRD = "M-9 0q4.5 -7 9 0q4.5 -7 9 0";

/** How far into the step a walker starts, and how long one step takes (seconds). */
const pace = (start: number, step: number) => ({ "--d": `${start}s`, "--t": `${step}s` }) as CSSProperties;

/** One strip of scenery, drawn several times side by side so it can roll past without an end showing. */
function Scenery({ className, tile, tiles, children }: { className: string; tile: number; tiles: number; children: ReactNode }) {
  return (
    <svg
      className={cn("absolute top-0 left-0 max-w-none", className)}
      fill="none"
      height="270"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox={`0 0 ${tile * tiles} 270`}
      width={tile * tiles}
    >
      <g transform={`translate(0,${-SCENE_TOP})`}>
        {Array.from({ length: tiles }, (_, i) => (
          <g key={i} transform={`translate(${i * tile},0)`}>
            {children}
          </g>
        ))}
      </g>
    </svg>
  );
}

function Cloud({ className, width }: { className: string; width: number }) {
  return (
    <svg className={cn("absolute overflow-visible", className)} fill="none" strokeLinejoin="round" strokeWidth="1.5" viewBox="-12 -24 88 44" width={width}>
      <path className="fill-background" d={CLOUD} />
    </svg>
  );
}

function Signpost({ x, name }: { x: number; name: string }) {
  const label = name.length > 18 ? `${name.slice(0, 17).trimEnd()}…` : name;
  const width = Math.round(label.length * 6.8 + 10);
  return (
    <g transform={`translate(${x},0)`}>
      <line y2="-92" />
      <path className="fill-background" d={`M-4 -90h${width}l9 9l-9 9h-${width}z`} />
      <text className="fill-muted-foreground font-medium text-[11.5px]" stroke="none" x="6" y="-76.5">
        {label}
      </text>
    </g>
  );
}

type HikerProps = {
  x: number;
  scale: number;
  /** How far into the step this walker starts, and how long their step takes (seconds). */
  start: number;
  step: number;
  pack?: boolean;
  poles?: boolean;
  hair?: boolean;
  hat?: "cap" | "bobble" | "brim";
  /** Holding the dog's lead: the front arm reaches out instead of swinging. */
  lead?: boolean;
  /** Waving the front arm. */
  wave?: boolean;
};

/** A walker with knees and elbows, so the step reads as a real stride. */
function Hiker({ x, scale, start, step, pack, poles, hair, hat, lead, wave }: HikerProps) {
  const arm = (back: boolean) => (
    <g transform="translate(2,-94)">
      <g className={cn("hero-c-ua", back && "hero-c-alt")}>
        {poles ? (
          <>
            <line y2="30" />
            <line strokeWidth="1.4" x1="0" x2="3" y1="30" y2="92" />
          </>
        ) : (
          <>
            <line y2="19" />
            <g transform="translate(0,19)">
              <g className={cn("hero-c-fa", back && "hero-c-alt")}>
                <line y2="17" />
              </g>
            </g>
          </>
        )}
      </g>
    </g>
  );
  const leg = (back: boolean) => (
    <g transform="translate(0,-60)">
      <g className={cn("hero-c-th", back && "hero-c-alt")}>
        <line y2="30" />
        <g transform="translate(0,30)">
          <g className={cn("hero-c-sh", back && "hero-c-alt")}>
            <path d="M0 0V30h7" />
          </g>
        </g>
      </g>
    </g>
  );
  return (
    <g transform={`translate(${x},0) scale(${scale})`}>
      <g className="hero-c-bob" style={pace(start, step)}>
        {arm(true)}
        {leg(true)}
        {pack ? <rect className="fill-background" height="24" rx="4" width="10" x="-10.5" y="-95" /> : null}
        <path d="M0 -60L3 -97" />
        {leg(false)}
        {hair ? (
          <g transform="translate(-2,-111)">
            <path className="hero-c-hair" d="M0 0q-8 3 -8 13" />
          </g>
        ) : null}
        <circle className="fill-background" cx="5" cy="-107" r={hat === "bobble" ? 9.5 : 8.5} />
        {hat === "cap" ? (
          <>
            <path className="fill-foreground" d="M-3.5 -109a8.5 8.5 0 0 1 17 0z" />
            <line x1="13" x2="19" y1="-109" y2="-108" />
          </>
        ) : null}
        {hat === "bobble" ? (
          <>
            <path className="fill-foreground" d="M-4.5 -109a9.5 9.5 0 0 1 19 0z" />
            <circle className="fill-foreground" cx="5" cy="-121" r="3" />
          </>
        ) : null}
        {hat === "brim" ? (
          <>
            <path d="M-9 -112h28" />
            <path className="fill-foreground" d="M-2 -112a7 7 0 0 1 14 0z" />
          </>
        ) : null}
        {lead ? (
          <>
            <path d="M2 -94l5 17l12 8" />
            <path d="M19 -69Q48 -30 74 -23" strokeWidth="1.2" />
          </>
        ) : wave ? (
          <g transform="translate(2,-94)">
            <path d="M0 0l9 -5" />
            <g transform="translate(9,-5)">
              <line className="hero-c-wave" x2="2" y2="-21" />
            </g>
          </g>
        ) : (
          arm(false)
        )}
      </g>
    </g>
  );
}

/** Eight walkers and a dog, walking on the spot while the scenery rolls past them. */
function Ramblers() {
  return (
    <svg className="hero-c-party" fill="none" height="270" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 640 270" width="640">
      <g transform={`translate(-340,${GROUND - SCENE_TOP})`}>
        {/* One further back, catching up and dropping back. */}
        <g className="hero-c-gap stroke-muted-foreground/60">
          <Hiker pack scale={0.98} start={-0.2} step={1.02} x={380} />
        </g>
        <g className="stroke-foreground">
          <Hiker hair scale={1.1} start={-0.7} step={1.15} x={455} />
          <Hiker hat="cap" scale={1.04} start={-0.35} step={1.09} x={505} />
          <g className="hero-chat" strokeWidth="1.5" transform="translate(462,-158)">
            <path className="fill-background" d="M0 0h30a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H12l-6 6v-6H0a6 6 0 0 1-6-6V6A6 6 0 0 1 0 0z" />
            <circle className="fill-foreground" cx="7" cy="10" r="1.4" stroke="none" />
            <circle className="fill-foreground" cx="15" cy="10" r="1.4" stroke="none" />
            <circle className="fill-foreground" cx="23" cy="10" r="1.4" stroke="none" />
          </g>
          <Hiker hat="bobble" scale={0.66} start={-0.1} step={0.69} x={578} />
          <Hiker hat="brim" scale={1.15} start={-0.5} step={1.2} x={625} />
          <Hiker pack poles scale={1.12} start={-0.9} step={1.17} x={715} />
          <Hiker lead scale={1.08} start={-0.25} step={1.13} x={800} />
          <g style={{ "--t": "0.5s" } as CSSProperties} transform="translate(866,0)">
            <g style={{ "--d": "-0.13s" } as CSSProperties} transform="translate(-11,-14)">
              <line className="hero-c-dl" y2="14" />
              <line className="hero-c-dl hero-c-alt" y2="14" />
            </g>
            <g transform="translate(9,-14)">
              <line className="hero-c-dl hero-c-alt" y2="14" />
              <line className="hero-c-dl" y2="14" />
            </g>
            <g transform="translate(-16,-21)">
              <path className="hero-tail" d="M0 0q-6 -4 -7 -11" />
            </g>
            <rect className="fill-background" height="11" rx="5.5" width="30" x="-16" y="-25" />
            <circle className="fill-background" cx="19" cy="-29" r="6" />
            <path d="M24 -28l7 2" />
            <path className="fill-foreground" d="M16 -33l-3 -6l6 3z" />
          </g>
          <Hiker pack scale={1.1} start={-0.6} step={1.15} wave x={940} />
        </g>
      </g>
    </svg>
  );
}

function CountrysideLook(p: HeroLookProps) {
  // Signposts name up to three of the places the group walks.
  const [first, second, third] = p.places.length > 0 ? p.places : p.everyPlace;
  return (
    <div className={cn("@container relative flex flex-col overflow-hidden", TALL)}>
      {/* The sky, where the page is wide enough to have room around the heading: the sun and one cloud first, the rest on a wider page. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden stroke-foreground/20 @4xl:block">
        <svg className="absolute top-6 right-6 overflow-visible @7xl:top-[4.25rem] @7xl:right-[6.5rem]" fill="none" strokeLinecap="round" strokeWidth="1.5" viewBox="0 0 100 100" width="100">
          <g transform="translate(50,50)">
            <circle r="20" />
            <g className="hero-c-sun">
              <path d="M0 -30v-10M0 30v10M-30 0h-10M30 0h10M21 -21l7 -7M-21 21l-7 7M21 21l7 7M-21 -21l-7 -7" />
            </g>
          </g>
        </svg>
        <Cloud className="hero-c-cloud top-[7.5rem] left-14 hidden @7xl:block" width={106} />
        <Cloud className="hero-c-cloud-2 top-10 left-10 @7xl:top-14 @7xl:left-40" width={62} />
        <Cloud className="hero-c-cloud-2 top-[14rem] right-32 hidden @7xl:block" width={79} />
      </div>
      <div className={cn(PAD, "relative flex flex-1 flex-col items-center justify-center gap-8 pt-12 pb-6")}>
        <Centre p={p} />
        <Buttons className="justify-center" joinHref={p.joinHref} />
      </div>
      <div className="hero-c-land">
        <div aria-hidden className="hero-c-scene pointer-events-none select-none">
          <Scenery className="hero-c-far stroke-border" tile={1280} tiles={4}>
            <path d={FAR_HILLS} />
            <path className="fill-background" d="M696 407l4 -28l4 28z" />
          </Scenery>
          <div className="hero-c-fly">
            <svg className="overflow-visible stroke-muted-foreground/60" fill="none" height="50" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 70 50" width="70">
              <g transform="translate(50,22)">
                <path className="hero-c-flap" d={BIRD} />
              </g>
              <g transform="translate(16,34) scale(0.8)">
                <path className="hero-c-flap" d={BIRD} style={{ animationDelay: "-0.25s" }} />
              </g>
              <g transform="translate(28,10) scale(0.7)">
                <path className="hero-c-flap" d={BIRD} style={{ animationDelay: "-0.4s" }} />
              </g>
            </svg>
          </div>
          <Scenery className="hero-c-mid stroke-foreground/20" tile={1280} tiles={4}>
            <path d={MID_HILLS} />
            <g transform="translate(320,510)">
              <line y2="-12" />
              <circle className="fill-background" cy="-22" r="10" />
            </g>
            <g transform="translate(346,512)">
              <line y2="-9" />
              <circle className="fill-background" cy="-16" r="7" />
            </g>
            <g transform="translate(640,536)">
              <path className="fill-background" d="M0 0v-7M-8 -7h16l-8 -22z" />
            </g>
            <g transform="translate(980,506)">
              <line y2="-12" />
              <circle className="fill-background" cy="-23" r="11" />
            </g>
          </Scenery>
          <Scenery className="hero-c-near stroke-muted-foreground/60" tile={2560} tiles={3}>
            <g transform={`translate(0,${GROUND})`}>
              <line className="stroke-foreground/20" strokeDasharray="2 8" x1="0" x2="2560" y1="0" y2="0" />
              {[120, 860, 1300, 2060].map((x) => (
                <path d={TUFT} key={x} transform={`translate(${x},0)`} />
              ))}
              {[520, 2440].map((x) => (
                <path d={ROCK} key={x} transform={`translate(${x},0)`} />
              ))}
              {first ? <Signpost name={first} x={300} /> : null}
              <g transform="translate(700,0)">
                <path d="M0 0v-70M0 -40l-14 -16M0 -52l12 -14" />
                <circle className="fill-background" cy="-96" r="34" />
                <path d="M-14 -100q8 -10 18 -4M-4 -84q10 -6 18 2" />
              </g>
              <path d="M0 0v-26M22 0v-26M44 0v-26M-6 -18h56M-6 -9h56" transform="translate(1050,0)" />
              {second ? <Signpost name={second} x={1480} /> : null}
              <path d="M0 -14h36M4 -14v14M32 -14v14M0 -26h36M2 -26v12M34 -26v12" transform="translate(1700,0)" />
              <path className="fill-background" d="M0 0v-18M-20 -18h40l-20 -34zM-15 -46h30l-15 -30zM-10 -72h20l-10 -22z" transform="translate(1900,0)" />
              {third ? <Signpost name={third} x={2250} /> : null}
            </g>
          </Scenery>
          <Ramblers />
        </div>
        <p className="hero-c-note px-5 pb-2 text-center text-muted-foreground text-xs sm:pb-3 md:text-sm">{p.groupNote}</p>
      </div>
    </div>
  );
}

const LOOKS: Record<HeroLookProps["look"], (p: HeroLookProps) => ReactNode> = {
  dots: DotsLook,
  split: SplitLook,
  stats: StatsLook,
  route: RouteLook,
  words: WordsLook,
  pins: PinsLook,
  steps: StepsLook,
  bento: BentoLook,
  bands: BandsLook,
  list: ListLook,
  trail: TrailLook,
  week: WeekLook,
  group: GroupLook,
  countryside: CountrysideLook,
};

export function HeroLooks(props: HeroLookProps) {
  const Look = LOOKS[props.look];
  return (
    <section
      aria-labelledby={ID}
      className="border-t first-of-type:border-t-0"
      data-hero-look={props.look}
      data-hero-moving={props.moving ? "" : undefined}
    >
      <Look {...props} />
    </section>
  );
}
