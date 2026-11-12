"use client";

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
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
