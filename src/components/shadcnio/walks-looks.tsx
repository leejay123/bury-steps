"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { IntentLink as Link } from "@/components/intent-link";
import { cn } from "@/lib/utils";
import type { HomeWalk } from "./home-data";
import { FILLER, MoreRows, type StripTone } from "./more-rows";
import { BUTTON_PRIMARY, BUTTON_SMALL_OUTLINE, WALKS_GRID } from "./parts";

/**
 * More looks for Walks coming up (page designer), from the Claude Design page
 * "Walks, What to expect and Come for a walk designs", Walks I to Q. Edge to
 * edge like the rest: full-width rows and cells with lines between, light only
 * (no dark panels), and never an empty cell (striped filler instead).
 *
 * The hill and route lines are drawn for the look from each walk's id, so a walk
 * keeps the same shape; they are not the real route. Meeting points aren't shown:
 * only members see those.
 */

const PAD = "px-5 md:px-12";
const TZ = "Europe/London";
const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: TZ });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: TZ });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: TZ });
const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const LONG_DAY = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const MONTH_YEAR = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: TZ });
const YMD = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ });

const at = (walk: HomeWalk) => (walk.startsAt ? new Date(walk.startsAt) : null);
const shortDate = (walk: HomeWalk) => {
  const d = at(walk);
  return d ? `${DAY.format(d)} ${DATE.format(d)} ${MONTH.format(d)}` : walk.when;
};
const time = (walk: HomeWalk) => {
  const d = at(walk);
  return d ? TIME.format(d) : "";
};
const distanceGrade = (walk: HomeWalk) => [walk.distance, walk.grade].filter(Boolean).join(" · ");

/** How hard a walk is, 1 to 3, from its grade's words; nothing for a grade it doesn't know. */
function gradeLevel(grade: string | null | undefined): number | null {
  const g = (grade ?? "").toLowerCase();
  if (/hard|challeng|strenuous|difficult|tough|demanding/.test(g)) return 3;
  if (/moderate|medium|intermediate/.test(g)) return 2;
  if (/easy|gentle|leisure|accessible|short/.test(g)) return 1;
  return null;
}

/** Three bars, as many dark as the walk is hard. */
function GradeMeter({ grade }: { grade: string | null | undefined }) {
  const level = gradeLevel(grade);
  if (!level) return null;
  return (
    <span aria-hidden className="inline-flex items-end gap-0.5">
      {[0, 1, 2].map((i) => (
        <span className={cn("w-1 rounded-[1px]", i < level ? "bg-foreground" : "bg-border")} key={i} style={{ height: 6 + i * 4 }} />
      ))}
    </span>
  );
}

function Facts({ walk, className }: { walk: HomeWalk; className?: string }) {
  const words = distanceGrade(walk);
  if (!words) return null;
  return (
    <span className={cn("flex items-center gap-2 text-muted-foreground text-sm", className)}>
      <GradeMeter grade={walk.grade} />
      {words}
    </span>
  );
}

/** A number from a walk's id, the same every time, to pick its drawn shape. */
function seed(id: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** A smooth line through points (x 0 to 280, y 0 to 120). */
function smooth(points: [number, number][]) {
  let d = `M${points[0]![0]} ${points[0]![1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    const mx = (x0 + x1) / 2;
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  return d;
}

/** A hill outline for a walk: steeper and higher the harder it is. */
function hillLine(walk: HomeWalk) {
  const rand = seed(walk.id, 7);
  const level = gradeLevel(walk.grade) ?? 2;
  // Easy walks roll gently; hard ones climb almost to the top of the box.
  const top = [52, 30, 10][level - 1]!;
  const points: [number, number][] = [];
  for (let i = 0; i <= 5; i++) {
    const high = i % 2 === 1 || rand() > 0.6;
    points.push([i * 56, Math.round(high ? top + rand() * 18 : 78 + rand() * 22)]);
  }
  return smooth(points);
}

/** The hill: a soft grey shape with a line along its top, stretched to the box. */
function Hill({ walk, className, strong }: { walk: HomeWalk; className?: string; strong?: boolean }) {
  const line = hillLine(walk);
  return (
    <svg aria-hidden className={cn("block w-full", className)} preserveAspectRatio="none" viewBox="0 0 280 120">
      <path className={strong ? "fill-background" : "fill-muted"} d={`${line} L280 120 L0 120 Z`} />
      <path
        className={strong ? "stroke-muted-foreground" : "stroke-muted-foreground/50"}
        d={line}
        fill="none"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** A dotted route for a walk, with a ring where it starts. */
function Route({ walk }: { walk: HomeWalk }) {
  const rand = seed(walk.id, 3);
  const points: [number, number][] = [];
  for (let i = 0; i <= 4; i++) points.push([14 + i * 53, Math.round(16 + rand() * 68)]);
  const d = smooth(points);
  return (
    <svg aria-hidden className="h-[5.5rem] w-full max-w-60" viewBox="0 0 240 100">
      <path className="stroke-border" d={d} fill="none" strokeLinecap="round" strokeWidth={7} />
      <path className="stroke-foreground" d={d} fill="none" strokeDasharray="1 7" strokeLinecap="round" strokeWidth={2.5} />
      <circle className="fill-background stroke-foreground" cx={points[0]![0]} cy={points[0]![1]} r={5} strokeWidth={2} />
    </svg>
  );
}

/** The time now, once the page is on screen (never while it's being made, so the copy saved for everyone stays the same). */
function useNow() {
  const minute = useSyncExternalStore(everyMinute, thisMinute, noTimeYet);
  return minute === null ? null : new Date(minute);
}
function everyMinute(change: () => void) {
  const timer = setInterval(change, 60_000);
  return () => clearInterval(timer);
}
const thisMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const noTimeYet = () => null;

/** "1 day to go", "3 hours to go"… once the time is known. */
function ToGo({ walk, className }: { walk: HomeWalk; className?: string }) {
  const now = useNow();
  const start = at(walk);
  if (!now || !start) return null;
  const hours = Math.round((start.getTime() - now.getTime()) / 3_600_000);
  if (hours < 1) return null;
  const big = hours < 24 ? `${hours} ${hours === 1 ? "hour" : "hours"}` : `${Math.round(hours / 24)} ${Math.round(hours / 24) === 1 ? "day" : "days"}`;
  return (
    <span className={cn("flex items-baseline gap-2 text-muted-foreground", className)}>
      <strong className="font-semibold text-3xl text-foreground tabular-nums tracking-tight md:text-4xl">{big}</strong> to go
    </span>
  );
}

function NoWalks() {
  return <p className={cn(PAD, "border-t py-10 text-center text-muted-foreground")}>No walks on the calendar yet.</p>;
}

function SeeWalk({ href, className }: { href: string; className?: string }) {
  return (
    <Link className={cn(BUTTON_PRIMARY, "h-11 gap-2 self-start px-5", className)} href={href}>
      See the walk
      <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
    </Link>
  );
}

/** The usual grid settings for the looks that are a grid (see gridChoice in the page designer). */
export type WalksGrid = { columns: number; rows: number; readMore: boolean; most: number; tone: StripTone };
const firstOf = (grid: WalksGrid, across: number) => (grid.readMore ? across * grid.rows : Number.POSITIVE_INFINITY);

// ── I · Next walk with a facts row ──────────────────────────────────────────

export function WalksFactsLook({ walks }: { walks: HomeWalk[] }) {
  const [next, ...rest] = walks;
  if (!next) return <NoWalks />;
  const d = at(next);
  const facts: [string, string][] = [
    ["Date", d ? `${DAY.format(d)} ${DATE.format(d)} ${MONTH.format(d)}` : next.when],
    ["Time", time(next)],
    ["Distance", next.distance ?? ""],
    ["Grade", next.grade ?? ""],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div className="border-t">
      <div className={cn(PAD, "flex flex-col gap-5 border-b py-8 md:flex-row md:items-end md:justify-between")}>
        <span className="flex flex-col gap-2">
          <small className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Next walk</small>
          <strong className="text-balance font-semibold text-3xl leading-tight tracking-tight md:text-4xl">{next.title}</strong>
        </span>
        <SeeWalk className="shrink-0" href={next.href} />
      </div>
      <dl className={cn("grid grid-cols-2 bg-muted/30", facts.length >= 4 && "md:grid-cols-4", facts.length === 3 && "md:grid-cols-3")}>
        {facts.map(([label, value], i) => (
          <div className={cn("flex flex-col gap-1 px-5 py-4 md:px-8", i % 2 === 1 && "border-s", i >= 2 && "max-md:border-t", i > 0 && "md:border-s")} key={label}>
            <dt className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{label}</dt>
            <dd className="font-semibold text-lg">{value}</dd>
          </div>
        ))}
      </dl>
      {rest.slice(0, 3).map((walk) => (
        <Link
          className={cn(PAD, "flex items-center justify-between gap-4 border-t py-4 hover:bg-muted/40")}
          href={walk.href}
          key={walk.id}
        >
          <span className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
            <span className="w-28 shrink-0 font-semibold text-muted-foreground text-sm">{shortDate(walk)}</span>
            <strong className="text-pretty font-semibold">{walk.title}</strong>
          </span>
          <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}

// ── J · This month's calendar ───────────────────────────────────────────────

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Year and month (1 to 12) a date falls in, in the UK. */
function ukMonth(d: Date) {
  const [y, m] = YMD.format(d).split("-").map(Number);
  return { y: y!, m: m! };
}

export function WalksCalendarLook({ walks }: { walks: HomeWalk[] }) {
  const dated = walks.filter((w) => w.startsAt);
  const months: { y: number; m: number }[] = [];
  for (const w of dated) {
    const mo = ukMonth(new Date(w.startsAt!));
    if (!months.some((x) => x.y === mo.y && x.m === mo.m)) months.push(mo);
  }
  const [index, setIndex] = useState(0);
  const now = useNow();
  if (months.length === 0) return <NoWalks />;
  const { y, m } = months[Math.min(index, months.length - 1)]!;
  const byDay = new Map<number, HomeWalk[]>();
  for (const w of dated) {
    const [wy, wm, wd] = YMD.format(new Date(w.startsAt!)).split("-").map(Number);
    if (wy === y && wm === m) byDay.set(wd!, [...(byDay.get(wd!) ?? []), w]);
  }
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells = Math.ceil((lead + daysIn) / 7) * 7;
  const today = now ? YMD.format(now) : null;
  const key = (day: number) => `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const title = MONTH_YEAR.format(new Date(Date.UTC(y, m - 1, 15)));
  return (
    <div className="border-t">
      <div className={cn(PAD, "flex items-center justify-between gap-4 border-b py-3")}>
        <strong className="font-semibold text-lg">{title}</strong>
        <span className="flex gap-2">
          <button aria-label="Last month" className={cn(BUTTON_SMALL_OUTLINE, "size-9 px-0")} disabled={index === 0} onClick={() => setIndex(index - 1)} type="button">
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button
            aria-label="Next month"
            className={cn(BUTTON_SMALL_OUTLINE, "size-9 px-0")}
            disabled={index >= months.length - 1}
            onClick={() => setIndex(index + 1)}
            type="button"
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </span>
      </div>
      {/* Computers and tablets: the month as a grid. */}
      <div className="max-sm:hidden">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAYS.map((d, i) => (
            <span className={cn("px-3 py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider", i > 0 && "border-s")} key={d}>
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: cells }, (_, i) => {
            const day = i - lead + 1;
            const edge = cn(i % 7 > 0 && "border-s", i >= 7 && "border-t");
            if (day < 1 || day > daysIn) return <div aria-hidden className={cn(edge, FILLER, "min-h-20")} key={i} />;
            const list = byDay.get(day) ?? [];
            const isToday = today === key(day);
            const past = today !== null && key(day) < today;
            return (
              <div className={cn(edge, "flex min-h-20 min-w-0 flex-col gap-1 p-2", list.length > 0 && "bg-muted/30")} key={i}>
                <span
                  className={cn(
                    "font-semibold text-xs tabular-nums",
                    isToday && "flex size-6 items-center justify-center rounded-full bg-foreground text-background",
                    past && "text-muted-foreground/60",
                  )}
                >
                  {day}
                </span>
                {list.map((w) => (
                  <Link className="truncate rounded-sm bg-foreground px-1.5 py-0.5 font-medium text-[0.6875rem] text-background hover:opacity-90" href={w.href} key={w.id} title={w.title}>
                    {time(w)} {w.title}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      {/* Phones: the days with walks, as a list. */}
      <ul className="sm:hidden">
        {[...byDay].map(([day, list], i) => (
          <li className={cn("grid grid-cols-[4.5rem_minmax(0,1fr)]", i > 0 && "border-t")} key={day}>
            <span className="flex flex-col items-center justify-center border-e bg-muted/30 py-3">
              <small className="font-semibold text-muted-foreground text-xs uppercase">{DAY.format(new Date(list[0]!.startsAt!))}</small>
              <strong className="text-2xl leading-none tabular-nums">{day}</strong>
            </span>
            <span className="flex flex-col">
              {list.map((w, j) => (
                <Link className={cn("flex flex-col gap-0.5 px-4 py-3 hover:bg-muted/40", j > 0 && "border-t")} href={w.href} key={w.id}>
                  <small className="font-semibold text-muted-foreground text-xs">{time(w)}</small>
                  <strong className="text-pretty font-semibold">{w.title}</strong>
                </Link>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── K · Route cards with a grade meter ──────────────────────────────────────

export function WalksRoutesLook({ walks, grid }: { walks: HomeWalk[]; grid: WalksGrid }) {
  if (walks.length === 0) return <NoWalks />;
  return (
    <div className="border-t">
      <MoreRows
        className="grid overflow-hidden pt-px *:relative *:-ms-px *:ps-px *:border-t *:border-l grid-cols-1 sm:grid-cols-2"
        columns={2}
        first={firstOf(grid, 2)}
        label="Walks coming up"
        tone={grid.tone}
      >
        {walks.slice(0, grid.columns === 4 ? 8 : 6).map((walk) => (
          <li key={walk.id}>
            <Link className="grid h-full gap-3 p-5 hover:bg-muted/40 md:grid-cols-[minmax(0,1fr)_15rem] md:p-6" href={walk.href}>
              <span className="flex min-w-0 flex-col gap-2">
                <span className="self-start rounded-full border px-2.5 py-0.5 font-semibold text-muted-foreground text-xs">
                  {shortDate(walk)} · {time(walk)}
                </span>
                <strong className="text-pretty font-semibold text-lg leading-snug">{walk.title}</strong>
                <Facts className="mt-auto" walk={walk} />
              </span>
              <span className="flex items-center max-md:hidden">
                <Route walk={walk} />
              </span>
            </Link>
          </li>
        ))}
      </MoreRows>
    </div>
  );
}

// ── L · Hill profiles, three or four across ─────────────────────────────────

export function WalksHillsLook({ walks, grid }: { walks: HomeWalk[]; grid: WalksGrid }) {
  if (walks.length === 0) return <NoWalks />;
  return (
    <div className="border-t">
      <MoreRows
        className={grid.columns === 4 ? WALKS_GRID.replace("lg:grid-cols-3", "lg:grid-cols-4") : WALKS_GRID}
        columns={grid.columns}
        first={firstOf(grid, grid.columns)}
        label="Walks coming up"
        tone={grid.tone}
      >
        {walks.slice(0, grid.most).map((walk) => (
          <li key={walk.id}>
            <Link className="flex h-full flex-col hover:bg-muted/40" href={walk.href}>
              <span className="flex flex-col gap-1 px-5 pt-6 md:px-6">
                <small className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{shortDate(walk)}</small>
                <strong className="font-semibold text-3xl tabular-nums tracking-tight">{time(walk)}</strong>
                <strong className="mt-2 text-pretty font-semibold leading-snug">{walk.title}</strong>
              </span>
              <Hill className="mt-auto h-24 pt-4" walk={walk} />
              {distanceGrade(walk) ? (
                <span className="flex items-center justify-between gap-3 border-t px-5 py-3 text-muted-foreground text-sm md:px-6">
                  <span className="flex items-center gap-2">
                    <GradeMeter grade={walk.grade} />
                    {walk.grade}
                  </span>
                  <strong className="font-semibold text-foreground">{walk.distance}</strong>
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </MoreRows>
    </div>
  );
}

// ── M · Next walk, then a timeline ──────────────────────────────────────────

function Timeline({ walks }: { walks: HomeWalk[] }) {
  return (
    <ol className="flex flex-1 flex-col">
      {walks.map((walk, i) => (
        <li className={cn("relative flex flex-1", i > 0 && "border-t")} key={walk.id}>
          <span aria-hidden className="absolute inset-y-0 start-7 w-px bg-border md:start-8" />
          <span aria-hidden className="absolute start-[1.5625rem] top-[1.375rem] size-2.5 rounded-full border-2 border-foreground bg-background md:start-[1.8125rem]" />
          <Link className="flex flex-1 flex-col justify-center gap-1 py-4 ps-14 pe-5 hover:bg-muted/40 md:ps-16 md:pe-8" href={walk.href}>
            <small className="font-semibold text-muted-foreground text-sm">
              {shortDate(walk)} · {time(walk)}
            </small>
            <strong className="text-pretty font-semibold">{walk.title}</strong>
            <Facts walk={walk} />
          </Link>
        </li>
      ))}
    </ol>
  );
}

function NextWalkPanel({ walk, hill }: { walk: HomeWalk; hill?: boolean }) {
  const d = at(walk);
  return (
    <div className="flex flex-col gap-4 bg-muted/30 pt-8 md:pt-10">
      <span className={cn(PAD, "flex flex-col gap-3")}>
        <small className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          Next walk{d ? ` · ${LONG_DAY.format(d)}` : ""}
        </small>
        <strong className="text-balance font-semibold text-3xl leading-[1.05] tracking-tight md:text-5xl">{walk.title}</strong>
        <ToGo walk={walk} />
      </span>
      <span className={cn(PAD, "flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground")}>
        {time(walk) ? <span>Starts {time(walk)}</span> : null}
        <Facts walk={walk} />
      </span>
      <span className={PAD}>
        <SeeWalk href={walk.href} />
      </span>
      {hill ? <Hill className="h-16" walk={walk} /> : <span className="pb-6" />}
    </div>
  );
}

export function WalksTimelineLook({ walks }: { walks: HomeWalk[] }) {
  const [next, ...rest] = walks;
  if (!next) return <NoWalks />;
  return (
    <div className={cn("grid border-t", rest.length > 0 && "lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]")}>
      <div className={cn(rest.length > 0 && "lg:border-e")}>
        <NextWalkPanel hill walk={next} />
      </div>
      {rest.length > 0 ? (
        <div className="flex flex-col max-lg:border-t">
          <Timeline walks={rest.slice(0, 4)} />
        </div>
      ) : null}
    </div>
  );
}

// ── N · Next walk over a wide hill, the rest below ──────────────────────────

function WalkRow({ walk, hill, className }: { walk: HomeWalk; hill?: boolean; className?: string }) {
  return (
    <Link
      className={cn(
        "grid items-center gap-x-5 gap-y-1 px-5 py-4 hover:bg-muted/40 md:px-8",
        hill ? "grid-cols-[5.5rem_minmax(0,1fr)] md:grid-cols-[6rem_minmax(0,1fr)_7rem]" : "grid-cols-[5.5rem_minmax(0,1fr)]",
        className,
      )}
      href={walk.href}
    >
      <span className="flex flex-col">
        <small className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{shortDate(walk)}</small>
        <strong className="font-semibold text-xl tabular-nums tracking-tight">{time(walk)}</strong>
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <strong className="text-pretty font-semibold">{walk.title}</strong>
        <Facts walk={walk} />
      </span>
      {hill ? <Hill className="h-12 max-md:hidden" walk={walk} /> : null}
    </Link>
  );
}

export function WalksHillTopLook({ walks }: { walks: HomeWalk[] }) {
  const [next, ...rest] = walks;
  if (!next) return <NoWalks />;
  const d = at(next);
  const others = rest.slice(0, 4);
  return (
    <div className="border-t">
      <div className="flex flex-col gap-4 pt-8">
        <span className={cn(PAD, "flex flex-col gap-5 md:flex-row md:items-end md:justify-between")}>
          <span className="flex flex-col gap-2">
            <small className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Next walk{d ? ` · ${LONG_DAY.format(d)}` : ""}
            </small>
            <strong className="text-balance font-semibold text-3xl leading-tight tracking-tight md:text-4xl">{next.title}</strong>
            <span className="flex flex-wrap items-center gap-x-5 gap-y-1 text-muted-foreground">
              {time(next) ? <span>Starts {time(next)}</span> : null}
              <Facts walk={next} />
            </span>
          </span>
          <SeeWalk className="shrink-0" href={next.href} />
        </span>
        <Hill className="h-20 md:h-28" walk={next} />
      </div>
      {others.length > 0 ? (
        <ul className="grid border-t md:grid-cols-2">
          {others.map((walk, i) => (
            <li className={cn(i > 0 && "max-md:border-t", i % 2 === 1 && "md:border-s", i >= 2 && "md:border-t")} key={walk.id}>
              <WalkRow hill walk={walk} />
            </li>
          ))}
          {others.length % 2 === 1 ? <li aria-hidden className={cn(FILLER, "max-md:hidden md:border-s", others.length > 2 && "md:border-t")} /> : null}
        </ul>
      ) : null}
    </div>
  );
}

// ── O · A date line with hill cards under it ────────────────────────────────

export function WalksDateLineLook({ walks, grid }: { walks: HomeWalk[]; grid: WalksGrid }) {
  if (walks.length === 0) return <NoWalks />;
  const shown = walks.slice(0, grid.columns);
  const cols = grid.columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <div className="border-t">
      {/* The line of dates, one over each card (computers only). */}
      <div className={cn("relative hidden border-b bg-muted/30 py-4 lg:grid", cols)}>
        <span aria-hidden className="absolute inset-x-6 top-[1.3rem] h-px bg-border" />
        {shown.map((walk, i) => (
          <span className="relative flex flex-col gap-1.5 px-6" key={walk.id}>
            <span aria-hidden className={cn("size-3 rounded-full border-2 border-foreground", i === 0 ? "bg-foreground" : "bg-background")} />
            <small className={cn("font-semibold text-xs uppercase tracking-wider", i === 0 ? "text-foreground" : "text-muted-foreground")}>
              {i === 0 ? "Next · " : ""}
              {shortDate(walk)}
            </small>
          </span>
        ))}
        {Array.from({ length: grid.columns - shown.length }, (_, i) => (
          <span aria-hidden key={`gap-${i}`} />
        ))}
      </div>
      <ul className={cn("grid grid-cols-1 sm:grid-cols-2", cols)}>
        {shown.map((walk, i) => (
          <li className={cn(i > 0 && "max-sm:border-t", i % 2 === 1 && "sm:border-s", i >= 2 && "sm:max-lg:border-t", i > 0 && "lg:border-s")} key={walk.id}>
            <Link className="flex h-full flex-col hover:bg-muted/40" href={walk.href}>
              <span className="flex flex-col gap-1 px-5 pt-5 md:px-6">
                <small className="font-semibold text-muted-foreground text-xs uppercase tracking-wider lg:hidden">{shortDate(walk)}</small>
                <strong className="font-semibold text-2xl tabular-nums tracking-tight">{time(walk)}</strong>
                <strong className="text-pretty font-semibold leading-snug">{walk.title}</strong>
              </span>
              <Hill className="mt-auto h-20 pt-3" walk={walk} />
              {distanceGrade(walk) ? (
                <span className="flex items-center justify-between gap-3 border-t px-5 py-3 text-muted-foreground text-sm md:px-6">
                  <span className="flex items-center gap-2">
                    <GradeMeter grade={walk.grade} />
                    {walk.grade}
                  </span>
                  <strong className="font-semibold text-foreground">{walk.distance}</strong>
                </span>
              ) : null}
            </Link>
          </li>
        ))}
        {Array.from({ length: (grid.columns - (shown.length % grid.columns)) % grid.columns }, (_, i) => (
          <li aria-hidden className={cn(FILLER, "hidden lg:block lg:border-s")} key={`fill-${i}`} />
        ))}
      </ul>
    </div>
  );
}

// ── P · Heading on the left, rows with a hill line each ─────────────────────

export function WalksHillRowsLook({ walks, side }: { walks: HomeWalk[]; side: ReactNode }) {
  return (
    <div className="grid border-t lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-5 border-b px-5 py-10 md:px-12 lg:border-e lg:border-b-0 lg:px-10">{side}</div>
      {walks.length === 0 ? (
        <p className="px-5 py-10 text-center text-muted-foreground md:px-12">No walks on the calendar yet.</p>
      ) : (
        <ul className="flex flex-col">
          {walks.slice(0, 5).map((walk, i) => {
            const d = at(walk);
            return (
              <li className={cn("flex flex-1", i > 0 && "border-t")} key={walk.id}>
                <Link
                  className="grid flex-1 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-5 gap-y-1 px-5 py-4 hover:bg-muted/40 md:grid-cols-[5rem_minmax(0,1fr)_6rem] md:px-8 xl:grid-cols-[5rem_minmax(0,1fr)_9rem_6rem]"
                  href={walk.href}
                >
                  <span className="flex flex-col">
                    <small className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{d ? DAY.format(d) : ""}</small>
                    <strong className="font-semibold text-xl tracking-tight">{d ? `${DATE.format(d)} ${MONTH.format(d)}` : walk.when}</strong>
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <strong className="text-pretty font-semibold">{walk.title}</strong>
                    <small className="text-muted-foreground text-sm">
                      {time(walk)}
                      <span className="md:hidden">{distanceGrade(walk) ? ` · ${distanceGrade(walk)}` : ""}</span>
                    </small>
                  </span>
                  <Hill className="h-11 max-xl:hidden" walk={walk} />
                  <span className="flex flex-col items-end gap-1 text-muted-foreground text-sm max-md:hidden">
                    <strong className="font-semibold text-foreground">{walk.distance}</strong>
                    <span className="flex items-center gap-1.5">
                      <GradeMeter grade={walk.grade} />
                      {walk.grade}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── Q · Next walk big with its hill, three beside ───────────────────────────

export function WalksBigHillLook({ walks }: { walks: HomeWalk[] }) {
  const [next, ...rest] = walks;
  if (!next) return <NoWalks />;
  const d = at(next);
  const beside = rest.slice(0, 3);
  return (
    <div className={cn("grid border-t", beside.length > 0 && "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]")}>
      <Link className={cn("flex flex-col bg-muted/30 hover:bg-muted/50", beside.length > 0 && "lg:border-e")} href={next.href}>
        <span className={cn(PAD, "flex flex-col gap-2 pt-8 md:px-9")}>
          <small className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Next walk{d ? ` · ${LONG_DAY.format(d)}` : ""}
          </small>
          <strong className="text-balance font-semibold text-3xl leading-tight tracking-tight">{next.title}</strong>
          <span className="flex flex-wrap items-center gap-x-5 gap-y-1 text-muted-foreground">
            {time(next) ? <span>Starts {time(next)}</span> : null}
            <Facts walk={next} />
          </span>
        </span>
        <Hill className="mt-auto h-32 pt-6 md:h-40" strong walk={next} />
      </Link>
      {beside.length > 0 ? (
        <ul className="flex flex-col max-lg:border-t">
          {beside.map((walk, i) => (
            <li className={cn("flex flex-1", i > 0 && "border-t")} key={walk.id}>
              <Link className="grid flex-1 grid-cols-[minmax(0,1fr)_8rem] hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_10rem]" href={walk.href}>
                <span className="flex min-w-0 flex-col justify-center gap-1 px-5 py-4 md:px-6">
                  <small className="font-semibold text-muted-foreground text-xs">
                    {shortDate(walk)} · {time(walk)}
                  </small>
                  <strong className="text-pretty font-semibold">{walk.title}</strong>
                  <Facts walk={walk} />
                </span>
                <span className="flex items-end border-s">
                  <Hill className="h-16" walk={walk} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
