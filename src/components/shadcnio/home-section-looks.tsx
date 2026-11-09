"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, CircleCheck, ChevronRight, type LucideIcon } from "lucide-react";
import { IntentLink as Link } from "@/components/intent-link";
import { SectionTitle } from "@/components/section-title";
import { cn } from "@/lib/utils";
import type { HomeWalk } from "./home-data";
import { STRIP_BG, type StripTone } from "./more-rows";
import { BUTTON_SMALL_OUTLINE } from "./parts";

/**
 * More looks for three homepage sections (chosen in the page designer), edge
 * to edge like the rest: full-width rows and cells, lines between them.
 *
 * - Walks coming up: rows (a date block each), next (the next walk big), week (by date, in columns)
 * - What you can expect: ticks (two columns), numbered (beside the heading), cells (icons)
 * - Come for a walk: split (words beside the buttons), band (dark), next (with the next walk)
 */
export type WalksLook = "original" | "rows" | "next" | "week";
export type ExpectLook = "original" | "ticks" | "numbered" | "cells";
export type CtaLook = "original" | "split" | "band" | "next";

export const isWalksLook = (v: unknown): v is WalksLook => v === "original" || v === "rows" || v === "next" || v === "week";
export const isExpectLook = (v: unknown): v is ExpectLook =>
  v === "original" || v === "ticks" || v === "numbered" || v === "cells";
export const isCtaLook = (v: unknown): v is CtaLook => v === "original" || v === "split" || v === "band" || v === "next";

const PAD = "px-5 md:px-12";
const TZ = "Europe/London";
const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: TZ });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: TZ });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: TZ });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const LONG_DAY = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });

const facts = (walk: HomeWalk) =>
  [walk.startsAt ? TIME.format(new Date(walk.startsAt)) : null, walk.distance, walk.grade].filter(Boolean).join(" · ");

/** Read more / Show less in its strip (white or grey, as chosen), as the other sections. */
function MoreStrip({ open, onToggle, tone }: { open: boolean; onToggle: () => void; tone: StripTone }) {
  return (
    <div className={cn("flex justify-center border-t px-5 py-3", STRIP_BG[tone])}>
      <button aria-expanded={open} className={BUTTON_SMALL_OUTLINE} onClick={onToggle} type="button">
        {open ? "Show less" : "Read more"}
      </button>
    </div>
  );
}

function useMore<T>(items: T[], first: number) {
  const [open, setOpen] = useState(false);
  const more = items.length > first;
  return { shown: more && !open ? items.slice(0, first) : items, more, open, toggle: () => setOpen(!open) };
}

function NoWalks() {
  return <p className={cn(PAD, "border-t py-10 text-center text-muted-foreground")}>No walks on the calendar yet.</p>;
}

// ── Walks coming up ─────────────────────────────────────────────────────────

/** A: each walk a full-width row with a date block. */
export function WalksRowsLook({ walks, tone }: { walks: HomeWalk[]; tone: StripTone }) {
  const { shown, more, open, toggle } = useMore(walks.slice(0, 6), 3);
  if (walks.length === 0) return <NoWalks />;
  return (
    <div className="border-t">
      <ul>
        {shown.map((walk, i) => {
          const at = walk.startsAt ? new Date(walk.startsAt) : null;
          return (
            <li className={cn(i > 0 && "border-t")} key={walk.id}>
              <Link className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center hover:bg-muted/40 md:grid-cols-[7.5rem_minmax(0,1fr)_auto]" href={walk.href}>
                <span className="flex flex-col items-center border-e py-4 tabular-nums">
                  <small className="font-semibold text-muted-foreground text-xs uppercase">{at ? DAY.format(at) : ""}</small>
                  <strong className="text-2xl leading-none">{at ? DATE.format(at) : ""}</strong>
                  <small className="text-muted-foreground text-xs">{at ? MONTH.format(at) : ""}</small>
                </span>
                <span className="flex min-w-0 flex-col gap-1 px-5 md:px-7">
                  <strong className="text-pretty font-semibold md:text-lg">{walk.title}</strong>
                  <small className="text-muted-foreground text-sm">{facts(walk)}</small>
                </span>
                <span className="flex items-center gap-2 pe-5 font-medium text-muted-foreground text-sm md:pe-12">
                  <span className="hidden sm:inline">See the walk</span>
                  <ChevronRight aria-hidden className="size-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {more ? <MoreStrip onToggle={toggle} open={open} tone={tone} /> : null}
    </div>
  );
}

/** B: the next walk big, the following ones stacked beside it. */
export function WalksNextLook({ walks }: { walks: HomeWalk[] }) {
  const [first, ...others] = walks;
  if (!first) return <NoWalks />;
  const at = first.startsAt ? new Date(first.startsAt) : null;
  return (
    <div className={cn("grid border-t", others.length > 0 && "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]")}>
      <Link
        className={cn(PAD, "flex flex-col justify-between gap-6 bg-muted/30 py-10 hover:bg-muted/50", others.length > 0 && "lg:border-e")}
        href={first.href}
      >
        <span className="self-start rounded-full border bg-background px-3 py-1 font-semibold text-xs">Next walk</span>
        <span className="flex flex-col gap-2">
          <strong className="text-balance font-semibold text-2xl leading-tight tracking-tight md:text-3xl">{first.title}</strong>
          <span className="text-muted-foreground">
            {at ? `${LONG_DAY.format(at)} · ${TIME.format(at)}` : first.when}
          </span>
        </span>
        {first.distance || first.grade ? (
          <span className="grid grid-cols-2 border-t pt-4">
            {first.distance ? (
              <span className="flex flex-col">
                <small className="text-muted-foreground text-xs">Distance</small>
                <strong>{first.distance}</strong>
              </span>
            ) : null}
            {first.grade ? (
              <span className="flex flex-col">
                <small className="text-muted-foreground text-xs">Grade</small>
                <strong>{first.grade}</strong>
              </span>
            ) : null}
          </span>
        ) : null}
      </Link>
      {others.length > 0 ? (
        <ul className="flex flex-col max-lg:border-t">
          {others.slice(0, 3).map((walk, i) => (
            <li className={cn("flex flex-1", i > 0 && "border-t")} key={walk.id}>
              <Link className={cn(PAD, "flex flex-1 flex-col justify-center gap-1 py-5 hover:bg-muted/40 lg:px-8")} href={walk.href}>
                <small className="text-muted-foreground text-sm">
                  {walk.startsAt ? `${DAY.format(new Date(walk.startsAt))} ${DATE.format(new Date(walk.startsAt))} ${MONTH.format(new Date(walk.startsAt))} · ${TIME.format(new Date(walk.startsAt))}` : walk.when}
                </small>
                <strong className="text-pretty font-semibold">{walk.title}</strong>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** C: grouped by date, a column per day (up to three), each day's walks by start time. */
export function WalksWeekLook({ walks }: { walks: HomeWalk[] }) {
  if (walks.length === 0) return <NoWalks />;
  const days = new Map<string, HomeWalk[]>();
  for (const walk of walks.slice(0, 6)) {
    const key = walk.startsAt ? LONG_DAY.format(new Date(walk.startsAt)) : walk.when;
    days.set(key, [...(days.get(key) ?? []), walk]);
  }
  const groups = [...days].slice(0, 3);
  return (
    <div
      className={cn(
        "grid border-t",
        groups.length === 2 && "md:grid-cols-2",
        groups.length === 3 && "md:grid-cols-3",
      )}
    >
      {groups.map(([day, list], i) => (
        <section aria-label={day} className={cn("flex flex-col", i > 0 && "max-md:border-t md:border-s")} key={day}>
          <h3 className={cn(PAD, "border-b bg-muted/30 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider md:px-8")}>
            {day}
          </h3>
          {list.map((walk, j) => (
            <Link
              className={cn(PAD, "grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 py-5 hover:bg-muted/40 md:px-8", j > 0 && "border-t")}
              href={walk.href}
              key={walk.id}
            >
              <strong className="tabular-nums">{walk.startsAt ? TIME.format(new Date(walk.startsAt)) : ""}</strong>
              <span className="flex min-w-0 flex-col gap-1">
                <strong className="text-pretty font-semibold">{walk.title}</strong>
                <small className="text-muted-foreground text-sm">{[walk.distance, walk.grade].filter(Boolean).join(" · ")}</small>
              </span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  );
}

// ── What you can expect ─────────────────────────────────────────────────────

/** A: a ticked list in two columns, two rows to start. */
export function ExpectTicksLook({ items, tone }: { items: string[]; tone: StripTone }) {
  const { shown, more, open, toggle } = useMore(items, 4);
  return (
    <div className="border-t">
      <ul className="grid [clip-path:inset(0_1px_1px_0)] sm:grid-cols-2">
        {shown.map((item) => (
          <li className={cn(PAD, "flex items-center gap-3.5 border-e border-b py-5 md:text-lg")} key={item}>
            <CircleCheck aria-hidden className="size-5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      {more ? <MoreStrip onToggle={toggle} open={open} tone={tone} /> : null}
    </div>
  );
}

/** B: the heading and intro on the left, the points numbered on the right. */
export function ExpectNumberedLook({
  id,
  items,
  lead,
  rest,
  title,
  tone,
}: {
  id: string;
  items: string[];
  lead: string;
  rest: string;
  title: string;
  tone: StripTone;
}) {
  const { shown, more, open, toggle } = useMore(items, 5);
  return (
    <div className="grid lg:grid-cols-[26rem_minmax(0,1fr)]">
      <div className={cn(PAD, "flex flex-col gap-3 border-b py-12 lg:border-e lg:border-b-0 lg:py-16")}>
        <SectionTitle className="text-balance font-semibold text-3xl tracking-tighter md:text-4xl" id={id} text={title} />
        <p className="text-pretty text-muted-foreground md:text-lg">
          <span className="font-medium text-foreground">{lead}</span> {rest}
        </p>
      </div>
      <div className="flex min-w-0 flex-col">
        <ol>
          {shown.map((item, i) => (
            <li className={cn(PAD, "flex items-baseline gap-5 py-5 md:text-lg", i > 0 && "border-t")} key={item}>
              <span className="w-7 shrink-0 font-mono text-muted-foreground text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ol>
        {more ? <MoreStrip onToggle={toggle} open={open} tone={tone} /> : null}
      </div>
    </div>
  );
}

/** C: a cell for each point with its icon, one row of three to start. */
export function ExpectCellsLook({ icons, items, tone }: { icons: LucideIcon[]; items: string[]; tone: StripTone }) {
  const { shown, more, open, toggle } = useMore(items, 3);
  return (
    <div className="border-t">
      <ul className="grid [clip-path:inset(0_1px_1px_0)] sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item, i) => {
          const Icon = icons[i % icons.length]!;
          return (
            <li className={cn(PAD, "flex flex-col gap-3.5 border-e border-b py-8 lg:px-10")} key={item}>
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Icon aria-hidden className="size-5" />
              </span>
              <strong className="text-pretty font-semibold md:text-lg">{item}</strong>
            </li>
          );
        })}
      </ul>
      {more ? <MoreStrip onToggle={toggle} open={open} tone={tone} /> : null}
    </div>
  );
}

// ── Come for a walk ─────────────────────────────────────────────────────────

type CtaProps = {
  title: string;
  guestBody: string;
  memberBody: string;
  members: string;
  joinHref: string;
};

/** The two lines under the heading: one for visitors, one for members (the page shows the right one). */
function CtaBody({ guestBody, memberBody, className }: Pick<CtaProps, "guestBody" | "memberBody"> & { className?: string }) {
  return (
    <p className={cn("text-pretty md:text-lg", className)}>
      <span className="font-medium" data-guest-home="">
        {guestBody}
      </span>
      <span className="font-medium" data-member-home="">
        {memberBody}
      </span>
    </p>
  );
}

function BigLink({
  href,
  children,
  dark,
  show,
}: {
  href: string;
  children: ReactNode;
  dark?: boolean;
  /** Only for visitors, or only for members (the page shows the right one). */
  show?: "guest" | "member";
}) {
  return (
    <Link
      data-guest-home={show === "guest" ? "" : undefined}
      data-member-home={show === "member" ? "" : undefined}
      className={cn(
        PAD,
        "flex flex-1 items-center justify-between gap-4 py-7 font-semibold text-lg lg:px-10",
        dark ? "bg-foreground text-background hover:bg-foreground/90" : "hover:bg-muted/50",
      )}
      href={href}
    >
      {children}
      <ArrowRight aria-hidden className="size-5 rtl:rotate-180" />
    </Link>
  );
}

/** A: the words on the left, two full-height buttons on the right. */
export function CtaSplitLook({ title, guestBody, memberBody, members, joinHref }: CtaProps) {
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className={cn(PAD, "flex flex-col justify-center gap-4 border-b py-14 lg:border-e lg:border-b-0 lg:py-20")}>
        <p className="text-sm">
          <span className="font-medium">{members}</span> <span className="text-muted-foreground">and counting</span>
        </p>
        <h2 className="text-balance font-semibold text-4xl leading-[1.05] tracking-tighter md:text-5xl" id="home-cta-heading">
          {title}
        </h2>
        <CtaBody className="text-muted-foreground" guestBody={guestBody} memberBody={memberBody} />
      </div>
      <div className="flex flex-col">
        <BigLink dark href={joinHref} show="guest">
          Join the group
        </BigLink>
        <span className="border-t" data-guest-home="" />
        <BigLink href="/walks" show="guest">
          See the walks
        </BigLink>
        <BigLink dark href="/walks" show="member">
          See the walks
        </BigLink>
      </div>
    </div>
  );
}

/** B: a dark band across the page, the buttons in light. */
export function CtaBandLook({ title, guestBody, memberBody, members, joinHref }: CtaProps) {
  return (
    <div className={cn(PAD, "flex flex-col items-center gap-5 bg-foreground py-16 text-center text-background md:py-24")}>
      <p className="text-sm opacity-80">
        <span className="font-semibold">{members}</span> and counting
      </p>
      <h2 className="max-w-3xl text-balance font-semibold text-4xl leading-[1.05] tracking-tighter md:text-6xl" id="home-cta-heading">
        {title}
      </h2>
      <CtaBody className="opacity-80" guestBody={guestBody} memberBody={memberBody} />
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          className="inline-flex h-12 items-center gap-2 rounded-full bg-background px-7 font-semibold text-foreground hover:bg-background/90"
          data-guest-home=""
          href={joinHref}
        >
          Join the group
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
        <Link
          className="inline-flex h-12 items-center gap-2 rounded-full border border-background/30 px-7 font-semibold hover:bg-background/10"
          href="/walks"
        >
          See the walks
        </Link>
      </div>
    </div>
  );
}

/** C: the invitation on the left, the next walk on the right. */
export function CtaNextLook({ next, ...cta }: CtaProps & { next: HomeWalk | null }) {
  if (!next) return <CtaSplitLook {...cta} />;
  const at = next.startsAt ? new Date(next.startsAt) : null;
  return (
    <div className="grid lg:grid-cols-2">
      <div className={cn(PAD, "flex flex-col justify-center gap-4 border-b py-14 lg:border-e lg:border-b-0 lg:py-20")}>
        <h2 className="text-balance font-semibold text-4xl leading-[1.05] tracking-tighter md:text-5xl" id="home-cta-heading">
          {cta.title}
        </h2>
        <CtaBody className="text-muted-foreground" guestBody={cta.guestBody} memberBody={cta.memberBody} />
        <p className="text-muted-foreground text-sm">{cta.members} and counting.</p>
        <Link
          className="mt-2 inline-flex h-12 items-center gap-2 self-start rounded-full bg-foreground px-7 font-semibold text-background hover:bg-foreground/90"
          data-guest-home=""
          href={cta.joinHref}
        >
          Join the group
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </Link>
      </div>
      <Link className="flex flex-col bg-muted/30 hover:bg-muted/50" href={next.href}>
        <span className={cn(PAD, "border-b py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider lg:px-10")}>
          The next walk
        </span>
        <span className={cn(PAD, "flex flex-1 flex-col justify-center gap-2 py-10 lg:px-10")}>
          <strong className="text-balance font-semibold text-2xl leading-tight tracking-tight">{next.title}</strong>
          <span className="text-muted-foreground">
            {[at ? `${LONG_DAY.format(at)} · ${TIME.format(at)}` : next.when, next.distance, next.grade].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className={cn(PAD, "flex items-center justify-between border-t bg-background py-4 font-medium text-sm lg:px-10")}>
          See this walk
          <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
        </span>
      </Link>
    </div>
  );
}
