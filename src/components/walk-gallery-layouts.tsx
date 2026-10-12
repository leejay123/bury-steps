"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  CloudSun,
  Footprints,
  MapPin,
  Mountain,
  Route,
  Timer,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { effectiveEndsAt, walkOpensAt, walkStatus } from "@/lib/walk-window";
import type { WalkGalleryLayout } from "@/lib/walk-page-sections";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalkNow } from "@/components/walk-header-styles";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import { WalkActionsBar } from "@/components/walk-manage-menu";
import { WalkStatusBadge } from "@/components/walk-status-badge";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
type Fact = { icon: Icon; label: string; value: string };
type Panel = { value: string; label: string; icon: Icon; count?: number | null; content: ReactNode };
type Controls = "visible" | "group" | "menu" | "list" | "dock";

/**
 * 30 more walk page designs (Settings → Site wording → Walk page cards →
 * Layout, 24 to 53), across four looks — polished app, clean and minimal,
 * bold outdoors, and organiser dashboard — each putting the walk's controls
 * somewhere different: every button visible, a button group with ⋯, one
 * Manage list, a list down the side, or a dock floating at the bottom.
 * Built from the same parts as every other layout (WalkIdeaParts), the
 * same for members and organisers.
 */
export function WalkGalleryLayouts({ layout, parts }: { layout: WalkGalleryLayout; parts: WalkIdeaParts }) {
  const p = parts;
  const [tab, setTab] = useState("overview");
  const clock = useWalkClock(p.timing);
  const now = useWalkNow(p.timing, p.attended?.count ?? null);
  const start = new Date(p.headline.startsAt);
  const end = effectiveEndsAt({
    durationMins: p.timing.durationMins,
    endedAt: p.timing.endedAt ? new Date(p.timing.endedAt) : null,
    startsAt: start,
  });
  const opens = walkOpensAt(start);
  const status = walkStatus(
    {
      cancelledAt: p.timing.cancelledAt ? new Date(p.timing.cancelledAt) : null,
      durationMins: p.timing.durationMins,
      endedAt: p.timing.endedAt ? new Date(p.timing.endedAt) : null,
      startsAt: start,
    },
    clock,
  );
  const minsLeft = Math.max(0, Math.round((end.getTime() - clock.getTime()) / 60_000));
  const minsToStart = Math.max(0, Math.round((start.getTime() - clock.getTime()) / 60_000));
  const countdown =
    status === "in-progress"
      ? { value: `${minsLeft}`, unit: "min left" }
      : status === "upcoming" || status === "starting-soon"
        ? minsToStart > 1440
          ? { value: `${Math.round(minsToStart / 1440)}`, unit: "days to go" }
          : minsToStart > 120
            ? { value: `${Math.round(minsToStart / 60)}`, unit: "hours to go" }
            : { value: `${minsToStart}`, unit: "min to go" }
        : status === "cancelled"
          ? { value: "—", unit: "cancelled" }
          : { value: "Done", unit: "finished" };

  const h = p.headline;
  const day = formatWalkDay(start);
  const time = formatTime(start);
  const facts: Fact[] = [
    { icon: CalendarDays, label: "Date", value: day },
    { icon: Clock, label: "Starts", value: time },
    { icon: Timer, label: "Length", value: formatWalkLength(h.durationMins) },
    ...(p.meeting ? [{ icon: MapPin, label: "Meet at", value: p.meeting }] : []),
    ...(h.distance ? [{ icon: Footprints, label: "Distance", value: h.distance }] : []),
    ...(h.elevationGain ? [{ icon: Mountain, label: "Climb", value: h.elevationGain }] : []),
    ...(h.grade ? [{ icon: TrendingUp, label: "Grade", value: h.grade }] : []),
    ...(h.walkLeader ? [{ icon: UserRound, label: "Leader", value: h.walkLeader }] : []),
  ];
  const factLine = facts.map((fact) => fact.value).join(" · ");
  const hasControls = Boolean(p.liveCompact || p.share || p.tools);

  // ── Building blocks ──────────────────────────────────────────────────
  const badge = (className?: string) => (
    <WalkStatusBadge
      cancelledAt={h.cancelledAt}
      className={cn("shrink-0", className)}
      durationMins={h.durationMins}
      endedAt={h.endedAt}
      startsAt={h.startsAt}
    />
  );
  const title = (className?: string) => (
    <h1 className={cn("text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl", className)}>
      {h.title}
    </h1>
  );
  const note = (className?: string) =>
    h.note ? <p className={cn("text-xs text-muted-foreground", className)}>{h.note}</p> : null;
  const live = now.live;
  const liveDot = (
    <span aria-hidden className="relative flex size-2.5">
      <span className={cn("relative size-2.5 rounded-full", live ? "bg-emerald-500" : "bg-muted-foreground/50")} />
    </span>
  );
  const statusLine = (className?: string) => (
    <span className={cn("flex items-center gap-2 text-sm font-medium", className)} suppressHydrationWarning>
      {liveDot}
      {now.eyebrow} · {now.line}
    </span>
  );
  const chips = (className?: string, tone = "bg-muted") => (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {facts.map((fact) => (
        <li className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:text-sm", tone)} key={fact.label}>
          <fact.icon aria-hidden className="size-3.5 opacity-70" />
          <span suppressHydrationWarning>{fact.value}</span>
        </li>
      ))}
    </ul>
  );
  const factGrid = (className?: string, cell?: string) => (
    <dl className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {facts.slice(0, 8).map((fact) => (
        <div className={cn("flex min-w-0 flex-col gap-1 rounded-xl bg-muted/60 p-3", cell)} key={fact.label}>
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <fact.icon aria-hidden className="size-3.5" />
            {fact.label}
          </dt>
          <dd className="truncate text-sm font-semibold" suppressHydrationWarning>
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
  const factRows = (className?: string) => (
    <dl className={cn("flex flex-col divide-y text-sm", className)}>
      <div className="flex items-center justify-between gap-4 py-2.5">
        <dt className="text-muted-foreground">Status</dt>
        <dd>{badge()}</dd>
      </div>
      {facts.map((fact) => (
        <div className="flex items-center justify-between gap-4 py-2.5" key={fact.label}>
          <dt className="flex items-center gap-2 text-muted-foreground">
            <fact.icon aria-hidden className="size-4" />
            {fact.label}
          </dt>
          <dd className="truncate text-right font-medium" suppressHydrationWarning>
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
  const bigStats = (className?: string, numberClass = "text-4xl sm:text-5xl") => (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4", className)}>
      {[
        { label: status === "in-progress" ? "Time left" : "Countdown", value: countdown.value, unit: countdown.unit },
        ...(p.attended?.count !== null && p.attended ? [{ label: "Clocked in", value: String(p.attended.count), unit: "people" }] : []),
        ...(h.distance ? [{ label: "Distance", value: h.distance, unit: "" }] : []),
        ...(h.elevationGain ? [{ label: "Climb", value: h.elevationGain, unit: "" }] : []),
        ...(h.grade ? [{ label: "Grade", value: h.grade, unit: "" }] : []),
      ]
        .slice(0, 4)
        .map((stat) => (
          <div className="flex min-w-0 flex-col gap-1" key={stat.label}>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{stat.label}</dt>
            <dd className={cn("truncate leading-none font-bold tracking-tight", numberClass)} suppressHydrationWarning>
              {stat.value}
            </dd>
            {stat.unit ? (
              <dd className="text-xs text-muted-foreground" suppressHydrationWarning>
                {stat.unit}
              </dd>
            ) : null}
          </div>
        ))}
    </dl>
  );
  // Every design: Clock in (while it can be used) and one Manage list (walk-manage-menu.tsx).
  const controls = (_kind: Controls, className?: string) =>
    hasControls ? <WalkActionsBar className={className} liveCompact={p.liveCompact} share={p.share} tools={p.tools} /> : null;
  const route = (
    <>
      {p.map}
      {p.forecast}
      {p.precise}
    </>
  );
  const overview = (
    <>
      {p.live}
      {p.details}
      {p.before}
    </>
  );
  const panels: Panel[] = [
    { value: "overview", label: "Overview", icon: Route, content: overview },
    { value: "route", label: "Map & weather", icon: MapPin, content: route },
    ...(p.attended ? [{ value: "attended", label: p.attended.label, icon: Users, count: p.attended.count, content: p.attended.content }] : []),
    ...(p.journey ? [{ value: "journey", label: "Journey", icon: Footprints, count: p.journey.count, content: p.journey.content }] : []),
  ];
  const tabs = (options: { list?: string; panel?: string; sticky?: boolean; icons?: boolean } = {}) => (
    <Tabs onValueChange={setTab} value={tab}>
      <div className={cn(options.sticky && "sticky top-16 z-20 -mx-1 bg-background/95 px-1 py-2 backdrop-blur-sm")}>
        <TabsList className={options.list}>
          {panels.map((panel) => (
            <TabsTrigger key={panel.value} value={panel.value}>
              {options.icons ? <panel.icon aria-hidden className="size-4" /> : null}
              {panel.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {panels.map((panel) => (
        <TabsContent className={cn("mt-4 flex flex-col gap-6", options.panel)} key={panel.value} value={panel.value}>
          {panel.content}
        </TabsContent>
      ))}
    </Tabs>
  );
  const sectionCard = (heading: string, icon: Icon, content: ReactNode, id?: string, className?: string) => {
    const HeadingIcon = icon;
    return (
      <section className={cn("flex scroll-mt-28 flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5", className)} id={id}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <HeadingIcon aria-hidden className="size-4 text-muted-foreground" />
          {heading}
        </h2>
        {content}
      </section>
    );
  };
  const stacked = (cards = true) =>
    cards ? (
      <>
        {p.live}
        {p.details}
        {p.before}
        {sectionCard("Map & weather", MapPin, route, "walk-route")}
        {p.attended ? sectionCard(p.attended.label, Users, p.attended.content, "walk-attended") : null}
        {p.journey ? sectionCard("Journey", Footprints, p.journey.content, "walk-journey") : null}
      </>
    ) : (
      <>
        {p.live}
        {p.details}
        {p.before}
        <div className="flex scroll-mt-28 flex-col gap-6" id="walk-route">
          {route}
        </div>
        {p.attended ? (
          <div className="flex scroll-mt-28 flex-col gap-3" id="walk-attended">
            {p.attended.content}
          </div>
        ) : null}
        {p.journey ? (
          <div className="flex scroll-mt-28 flex-col gap-3" id="walk-journey">
            {p.journey.content}
          </div>
        ) : null}
      </>
    );
  const jumpLinks = (className?: string) => (
    <nav aria-label="On this page" className={cn("flex flex-col gap-0.5 text-sm", className)}>
      {[
        { href: "#walk-overview", label: "Overview" },
        { href: "#walk-route", label: "Map & weather" },
        ...(p.attended ? [{ href: "#walk-attended", label: p.attended.label }] : []),
        ...(p.journey ? [{ href: "#walk-journey", label: "Journey" }] : []),
      ].map((link) => (
        <a className="rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" href={link.href} key={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
  const peopleStack = p.attended?.count ? (
    <div className="flex items-center gap-2">
      <div aria-hidden className="flex -space-x-2">
        {Array.from({ length: Math.min(4, p.attended.count) }).map((_, i) => (
          <span
            className={cn("size-7 rounded-full border-2 border-background", ["bg-emerald-200", "bg-amber-200", "bg-sky-200", "bg-rose-200"][i])}
            key={i}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{p.attended.count} clocked in</span>
    </div>
  ) : null;
  const timelineBar = (
    <div className="flex flex-col gap-2">
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-600"
          style={{
            width: `${Math.min(100, Math.max(0, ((clock.getTime() - opens.getTime()) / (end.getTime() - opens.getTime())) * 100))}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground" suppressHydrationWarning>
        <span>{formatTime(opens)} clock-in opens</span>
        <span>{time} set off</span>
        <span>{formatTime(end)} finish</span>
      </div>
    </div>
  );
  const page = (children: ReactNode, className?: string) => (
    <div className={cn("flex flex-col gap-6", className)}>
      {p.notices}
      {children}
    </div>
  );

  switch (layout) {
    // ── Polished app ────────────────────────────────────────────────────
    // 24 · Trail card: the map as a rounded hero, a card overlapping it.
    case "trailcard":
      return page(
        <>
          <div className="flex flex-col">
            {p.map ? <div className="overflow-hidden rounded-3xl [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-0">{p.map}</div> : null}
            <section
              className={cn(
                "relative z-10 mx-auto flex w-[calc(100%-1rem)] flex-col gap-4 rounded-2xl border bg-background p-5 shadow-xl sm:w-[calc(100%-2.5rem)] sm:p-6",
                p.map && "-mt-16",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">{badge()}{statusLine()}</div>
              {title()}
              {chips()}
              {note()}
              {controls("group")}
            </section>
          </div>
          {tabs({ list: "w-full sm:w-fit" })}
        </>,
      );

    // 25 · Activity: the leader up top, big activity stats, then the map.
    case "activity":
      return page(
        <>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
              {(h.walkLeader ?? "BS").slice(0, 2).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">{h.walkLeader ? `Led by ${h.walkLeader}` : "Bury Steps walk"}</span>
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {day} at {time}
                {p.meeting ? ` · ${p.meeting}` : ""}
              </span>
            </div>
            <span className="ml-auto">{badge()}</span>
          </div>
          {title("sm:text-4xl")}
          {bigStats("border-y py-5")}
          {controls("visible")}
          {p.map}
          {tabs()}
        </>,
      );

    // 26 · Listing: details on the left, a booking-style card on the right that stays in view.
    case "listing":
      return page(
        <>
          <div className="flex flex-col gap-2">
            {title("sm:text-4xl")}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground" suppressHydrationWarning>
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden className="size-4" />
                {p.meeting ?? "Meeting point to be confirmed"}
              </span>
              <span>·</span>
              <span>{h.grade ?? "Walk"}</span>
              {h.distance ? (
                <>
                  <span>·</span>
                  <span>{h.distance}</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-w-0 flex-col gap-6 divide-y [&>*]:pb-6">
              {p.details}
              {p.before}
              <div className="flex flex-col gap-6">{route}</div>
              {p.attended ? <div className="flex flex-col gap-3">{p.attended.content}</div> : null}
              {p.journey ? <div className="flex flex-col gap-3">{p.journey.content}</div> : null}
            </div>
            <aside className="flex flex-col gap-4 self-start rounded-2xl border p-5 shadow-lg lg:sticky lg:top-24">
              <div className="flex items-baseline justify-between gap-2" suppressHydrationWarning>
                <span className="text-2xl font-semibold">{time}</span>
                <span className="text-sm text-muted-foreground">{day}</span>
              </div>
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border text-sm" suppressHydrationWarning>
                <div className="flex flex-col border-r p-3">
                  <span className="text-[11px] font-semibold uppercase">Set off</span>
                  {time}
                </div>
                <div className="flex flex-col p-3">
                  <span className="text-[11px] font-semibold uppercase">Finish</span>
                  {formatTime(end)}
                </div>
              </div>
              {statusLine()}
              {p.live}
              {controls("menu", "[&>*]:w-full sm:flex-col sm:items-stretch")}
              {note("text-center")}
            </aside>
          </div>
        </>,
      );

    // 27 · App sheet: the map behind, the walk in a sheet sliding over it.
    case "appsheet":
      return page(
        <div className="flex flex-col">
          {p.map}
          <section className={cn("relative z-10 flex flex-col gap-4 rounded-t-[2rem] border-x border-t bg-background px-4 pt-3 pb-4 shadow-[0_-12px_30px_-20px_rgb(0_0_0/0.4)] sm:px-6", p.map && "-mt-10")}>
            <span aria-hidden className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/25" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                {statusLine("text-xs")}
                {title("text-xl sm:text-2xl")}
              </div>
              {peopleStack}
            </div>
            {chips(undefined, "bg-muted/70")}
            {controls("group")}
            {tabs({ list: "w-full" })}
          </section>
        </div>,
      );

    // 28 · Story cards: a row of cards to swipe through, then the details.
    case "stories":
      return page(
        <>
          <div className="flex flex-col gap-2">
            {statusLine()}
            {title()}
            {note()}
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {[
              { icon: CalendarDays, label: "When", value: `${day}, ${time}`, sub: `Back by ${formatTime(end)}`, href: "#walk-overview", tone: "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-50" },
              { icon: MapPin, label: "Where", value: p.meeting ?? "—", sub: p.what3words ? `///${p.what3words}` : "Map and directions", href: "#walk-route", tone: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50" },
              { icon: CloudSun, label: "Weather", value: "Forecast", sub: "Hour by hour for the walk", href: "#walk-route", tone: "bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-50" },
              ...(p.attended ? [{ icon: Users, label: "People", value: p.attended.count === null ? "See who" : `${p.attended.count} in`, sub: "Who's on the walk", href: "#walk-attended", tone: "bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-50" }] : []),
              ...(p.journey ? [{ icon: Footprints, label: "Journey", value: `${p.journey.count}`, sub: "moments so far", href: "#walk-journey", tone: "bg-violet-100 text-violet-950 dark:bg-violet-950 dark:text-violet-50" }] : []),
            ].map((card) => (
              <a className={cn("flex w-44 shrink-0 snap-start flex-col justify-between gap-6 rounded-2xl p-4 sm:w-52", card.tone)} href={card.href} key={card.label}>
                <card.icon aria-hidden className="size-5" />
                <span className="flex flex-col">
                  <span className="text-xs font-semibold uppercase opacity-70">{card.label}</span>
                  <span className="truncate text-lg font-semibold" suppressHydrationWarning>
                    {card.value}
                  </span>
                  <span className="truncate text-xs opacity-70">{card.sub}</span>
                </span>
              </a>
            ))}
          </div>
          {controls("group")}
          <div className="flex scroll-mt-28 flex-col gap-6" id="walk-overview">
            {stacked()}
          </div>
        </>,
      );

    // 29 · Colour hero: a status-coloured top, stat cards overlapping its edge.
    case "colourhero":
      return page(
        <>
          <section className={cn("flex flex-col gap-3 rounded-3xl px-5 pt-6 pb-16 sm:px-8", now.tone)}>
            {statusLine("text-current")}
            {title("sm:text-4xl")}
            <p className="text-sm opacity-80" suppressHydrationWarning>
              {day} · {time} to {formatTime(end)}
            </p>
            {note("text-current opacity-70")}
          </section>
          <div className="relative z-10 -mt-14 grid grid-cols-2 gap-3 px-3 sm:grid-cols-4 sm:px-6">
            {facts.slice(2, 6).map((fact) => (
              <div className="flex min-w-0 flex-col gap-1 rounded-2xl border bg-background p-4 shadow-md" key={fact.label}>
                <fact.icon aria-hidden className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{fact.label}</span>
                <span className="truncate font-semibold" suppressHydrationWarning>
                  {fact.value}
                </span>
              </div>
            ))}
          </div>
          {controls("group")}
          {tabs()}
        </>,
      );

    // 30 · Event page: a date badge, who's going, and a clear call to action.
    case "event":
      return page(
        <>
          <div className="flex gap-4">
            <div aria-hidden className="flex w-16 shrink-0 flex-col overflow-hidden rounded-xl border text-center shadow-sm">
              <span className="bg-destructive py-0.5 text-[11px] font-semibold text-white uppercase" suppressHydrationWarning>
                {start.toLocaleString("en-GB", { month: "short", timeZone: "Europe/London" })}
              </span>
              <span className="py-1 text-2xl font-bold" suppressHydrationWarning>
                {start.toLocaleString("en-GB", { day: "numeric", timeZone: "Europe/London" })}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              {title()}
              <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                {start.toLocaleString("en-GB", { weekday: "long", timeZone: "Europe/London" })} · {time}–{formatTime(end)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex flex-col gap-2">
              {statusLine()}
              {peopleStack ?? <span className="text-sm text-muted-foreground">Be one of the first to clock in.</span>}
            </div>
            {controls("menu")}
          </div>
          {chips()}
          {tabs({ icons: true })}
        </>,
      );

    // 31 · Feed: each part of the walk as a step down a line.
    case "feed":
      return page(
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              {statusLine()}
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {factLine}
              </p>
            </div>
            {controls("group")}
          </div>
          <ol className="relative flex flex-col gap-8 border-l pl-6">
            {[
              { icon: Route, label: "The walk", content: overview },
              { icon: MapPin, label: "Getting there", content: route },
              ...(p.attended ? [{ icon: Users, label: p.attended.label, content: p.attended.content }] : []),
              ...(p.journey ? [{ icon: Footprints, label: "Journey", content: p.journey.content }] : []),
            ].map((step) => (
              <li className="relative flex flex-col gap-4" key={step.label}>
                <span className="absolute top-0 -left-[2.3rem] flex size-7 items-center justify-center rounded-full border bg-background">
                  <step.icon aria-hidden className="size-3.5" />
                </span>
                <h2 className="font-semibold">{step.label}</h2>
                {step.content}
              </li>
            ))}
          </ol>
        </>,
      );

    // ── Clean and minimal ───────────────────────────────────────────────
    // 32 · Issue page: the content on the left, a properties panel on the right.
    case "issue":
      return page(
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="flex min-w-0 flex-col gap-6">
            {title("sm:text-3xl")}
            {stacked(false)}
          </div>
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start lg:border-l lg:pl-6">
            {controls("list")}
            {factRows()}
            {note()}
          </aside>
        </div>,
      );

    // 33 · Page with properties: a thin colour strip, a big title, properties, then fold-out parts.
    case "doc":
      return page(
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div aria-hidden className={cn("h-2 rounded-full", live ? "bg-emerald-500" : "bg-muted")} />
          {title("text-3xl sm:text-5xl")}
          <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-y-2 text-sm">
            {facts.map((fact) => (
              <div className="contents" key={fact.label}>
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <fact.icon aria-hidden className="size-4" />
                  {fact.label}
                </dt>
                <dd suppressHydrationWarning>{fact.value}</dd>
              </div>
            ))}
          </dl>
          {controls("menu")}
          {p.live}
          <Accordion className="border-y" defaultValue={["about"]} type="multiple">
            {[
              { value: "about", label: "About this walk", content: <>{p.details}{p.before}</> },
              { value: "route", label: "Map & weather", content: route },
              ...(p.attended ? [{ value: "attended", label: p.attended.label, content: p.attended.content }] : []),
              ...(p.journey ? [{ value: "journey", label: "Journey", content: p.journey.content }] : []),
            ].map((row) => (
              <AccordionItem key={row.value} value={row.value}>
                <AccordionTrigger className="text-base">{row.label}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4">{row.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>,
      );

    // 34 · Docs: a contents list on the side, every part down the page.
    case "docs":
      return page(
        <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">On this page</span>
            {jumpLinks()}
            {controls("list", "border-t pt-4")}
          </aside>
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex scroll-mt-28 flex-col gap-2" id="walk-overview">
              {statusLine()}
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {factLine}
              </p>
            </div>
            {stacked()}
          </div>
        </div>,
      );

    // 35 · Quiet rows: each part a row, its name on the left, its content on the right.
    case "rows":
      return page(
        <>
          <div className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              {title()}
              {statusLine()}
            </div>
            {controls("group")}
          </div>
          {[
            { label: "Details", content: <>{p.live}{p.details}{p.before}</> },
            { label: "Map & weather", content: route },
            ...(p.attended ? [{ label: p.attended.label, content: p.attended.content }] : []),
            ...(p.journey ? [{ label: "Journey", content: p.journey.content }] : []),
          ].map((row) => (
            <section className="grid gap-4 border-b pb-6 lg:grid-cols-[12rem_minmax(0,1fr)]" key={row.label}>
              <h2 className="text-sm font-semibold text-muted-foreground">{row.label}</h2>
              <div className="flex min-w-0 flex-col gap-6">{row.content}</div>
            </section>
          ))}
        </>,
      );

    // 36 · Focus: one narrow column, the title centred, one main button.
    case "focus":
      return page(
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            {badge()}
            {title("sm:text-4xl")}
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {factLine}
            </p>
            {controls("menu", "justify-center")}
          </div>
          {tabs({ list: "mx-auto" })}
        </div>,
      );

    // 37 · Breadcrumbs: a quiet trail at the top, a meta row, then tabs.
    case "breadcrumbs":
      return page(
        <>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Walks</span>
            <ChevronRight aria-hidden className="size-3.5" />
            <span suppressHydrationWarning>{day}</span>
            <ChevronRight aria-hidden className="size-3.5" />
            <span className="truncate text-foreground">{h.title}</span>
          </nav>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              {title()}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {badge()}
                {facts.slice(0, 5).map((fact) => (
                  <span className="flex items-center gap-1.5" key={fact.label} suppressHydrationWarning>
                    <fact.icon aria-hidden className="size-4" />
                    {fact.value}
                  </span>
                ))}
              </div>
              {note()}
            </div>
            {controls("group")}
          </div>
          {tabs({ icons: true })}
        </>,
      );

    // 38 · Split pane: the walk on one side, the map and weather on the other.
    case "splitpane":
      return page(
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-5">
            {statusLine()}
            {title()}
            {factGrid("sm:grid-cols-2")}
            {controls("visible")}
            {p.live}
            {p.details}
            {p.before}
            {p.attended ? sectionCard(p.attended.label, Users, p.attended.content) : null}
            {p.journey ? sectionCard("Journey", Footprints, p.journey.content) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:self-start">{route}</div>
        </div>,
      );

    // 39 · Type first: the time and day set huge, very little else.
    case "typographic":
      return page(
        <>
          <div className="flex flex-col gap-2 border-b pb-8">
            <span className="text-sm text-muted-foreground" suppressHydrationWarning>
              {day}
            </span>
            <span className="text-7xl leading-none font-bold tracking-tighter sm:text-8xl" suppressHydrationWarning>
              {time}
            </span>
            {title("mt-3 text-xl font-medium sm:text-2xl")}
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {facts.slice(2).map((fact) => fact.value).join("  /  ")}
            </p>
            {statusLine("mt-1")}
          </div>
          {controls("group")}
          {tabs()}
        </>,
      );

    // ── Bold outdoors ───────────────────────────────────────────────────
    // 40 · Trailhead sign: a dark green sign with the walk in big letters.
    case "trailhead":
      return page(
        <>
          <section className="flex flex-col gap-5 rounded-2xl border-4 border-emerald-950 bg-emerald-900 p-6 text-emerald-50 shadow-[inset_0_0_0_2px_rgb(255_255_255/0.15)] sm:p-8">
            <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-80">Bury Steps · Trail</span>
            {title("text-3xl uppercase sm:text-5xl")}
            <div className="grid grid-cols-2 gap-4 border-t border-emerald-50/20 pt-5 sm:grid-cols-4" suppressHydrationWarning>
              {[
                ["Distance", h.distance ?? "—"],
                ["Climb", h.elevationGain ?? "—"],
                ["Time", formatWalkLength(h.durationMins)],
                ["Grade", h.grade ?? "—"],
              ].map(([label, value]) => (
                <div className="flex flex-col" key={label}>
                  <span className="text-[11px] font-bold tracking-widest uppercase opacity-70">{label}</span>
                  <span className="text-xl font-bold">{value}</span>
                </div>
              ))}
            </div>
            <span className="text-sm opacity-90" suppressHydrationWarning>
              {day} · sets off {time}
              {p.meeting ? ` from ${p.meeting}` : ""}
            </span>
          </section>
          {controls("group")}
          {tabs()}
        </>,
      );

    // 41 · Colour blocks: the key facts as a grid of coloured blocks.
    case "blocks":
      return page(
        <>
          {title("sm:text-4xl")}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className={cn("col-span-2 flex flex-col justify-between gap-6 rounded-2xl p-5", now.tone)} suppressHydrationWarning>
              <span className="text-xs font-bold uppercase">{now.eyebrow}</span>
              <span className="text-xl font-bold">{now.line}</span>
            </div>
            <div className="flex flex-col justify-between gap-6 rounded-2xl bg-amber-300 p-5 text-amber-950" suppressHydrationWarning>
              <Clock aria-hidden className="size-5" />
              <span className="text-2xl font-bold">{time}</span>
            </div>
            <div className="flex flex-col justify-between gap-6 rounded-2xl bg-sky-300 p-5 text-sky-950">
              <Footprints aria-hidden className="size-5" />
              <span className="text-2xl font-bold">{h.distance ?? formatWalkLength(h.durationMins)}</span>
            </div>
            <div className="col-span-2 flex flex-col justify-between gap-6 rounded-2xl bg-rose-300 p-5 text-rose-950 sm:col-span-1">
              <MapPin aria-hidden className="size-5" />
              <span className="truncate text-lg font-bold">{p.meeting ?? "—"}</span>
            </div>
            <div className="col-span-2 flex flex-col justify-between gap-4 rounded-2xl bg-foreground p-5 text-background sm:col-span-3">
              <span className="text-xs font-bold uppercase opacity-70">Walk</span>
              {controls("group")}
            </div>
          </div>
          {tabs()}
        </>,
      );

    // 42 · Poster: a big coloured poster top, then the content below a tear line.
    case "poster":
      return page(
        <>
          <section className="flex min-h-72 flex-col justify-end gap-3 rounded-3xl bg-orange-500 p-6 text-orange-950 sm:p-10">
            <span className="text-sm font-bold tracking-widest uppercase" suppressHydrationWarning>
              {day} · {time}
            </span>
            <h1 className="text-4xl leading-[0.95] font-black tracking-tight uppercase sm:text-6xl">{h.title}</h1>
            <span className="text-sm font-semibold" suppressHydrationWarning>
              {[p.meeting, h.distance, h.grade].filter(Boolean).join(" · ")}
            </span>
          </section>
          <div aria-hidden className="h-px border-t-2 border-dashed" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {statusLine()}
            {controls("group")}
          </div>
          {tabs()}
        </>,
      );

    // 43 · Badges: round badges for the walk's numbers.
    case "badges":
      return page(
        <>
          <div className="flex flex-col gap-2">
            {statusLine()}
            {title()}
            {note()}
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Grade", value: h.grade ?? "—", tone: "bg-emerald-500 text-white" },
              { label: "Miles", value: h.distance ?? "—", tone: "bg-sky-500 text-white" },
              { label: "Climb", value: h.elevationGain ?? "—", tone: "bg-amber-500 text-amber-950" },
              { label: "Starts", value: time, tone: "bg-rose-500 text-white" },
              { label: "Hours", value: (h.durationMins / 60).toFixed(1).replace(/\.0$/, ""), tone: "bg-violet-500 text-white" },
            ].map((b) => (
              <div className={cn("flex size-24 flex-col items-center justify-center rounded-full text-center shadow-md ring-4 ring-background", b.tone)} key={b.label}>
                <span className="max-w-20 truncate text-lg leading-tight font-black" suppressHydrationWarning>
                  {b.value}
                </span>
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">{b.label}</span>
              </div>
            ))}
          </div>
          {controls("menu")}
          {tabs()}
        </>,
      );

    // 44 · Status takeover: the whole top in the walk's colour, the countdown huge.
    case "takeover":
      return page(
        <>
          <section className={cn("flex flex-col items-center gap-2 rounded-3xl px-6 py-10 text-center", now.tone)}>
            <span className="text-sm font-bold tracking-widest uppercase" suppressHydrationWarning>
              {now.eyebrow}
            </span>
            <span className="text-7xl leading-none font-black tracking-tighter sm:text-8xl" suppressHydrationWarning>
              {countdown.value}
            </span>
            <span className="text-sm font-semibold" suppressHydrationWarning>
              {countdown.unit}
            </span>
            {title("mt-4 text-xl sm:text-2xl")}
            <span className="text-sm opacity-80" suppressHydrationWarning>
              {day} · {time} · {p.meeting ?? ""}
            </span>
          </section>
          {controls("group", "sm:mx-auto")}
          {tabs({ list: "sm:mx-auto" })}
        </>,
      );

    // 45 · Contour lines: a header drawn like a map's height lines.
    case "contours":
      return page(
        <>
          <section className="relative overflow-hidden rounded-3xl border bg-stone-50 p-6 sm:p-8 dark:bg-stone-950">
            <svg aria-hidden className="absolute inset-0 size-full text-stone-300 dark:text-stone-700" preserveAspectRatio="none" viewBox="0 0 400 200">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <path
                  d={`M -20 ${40 + i * 22} C 80 ${10 + i * 22}, 160 ${80 + i * 20}, 240 ${40 + i * 22} S 380 ${20 + i * 24}, 430 ${50 + i * 21}`}
                  fill="none"
                  key={i}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              ))}
            </svg>
            <div className="relative flex flex-col gap-3">
              {statusLine()}
              {title("sm:text-4xl")}
              {chips(undefined, "bg-background/90 shadow-sm")}
              {note()}
            </div>
          </section>
          {controls("visible")}
          {tabs()}
        </>,
      );

    // 46 · Ticket: a colourful ticket with a perforated stub.
    case "ticket2":
      return page(
        <>
          <section className="grid overflow-hidden rounded-2xl bg-sky-600 text-white shadow-lg sm:grid-cols-[minmax(0,1fr)_13rem]">
            <div className="flex flex-col gap-4 p-6">
              <span className="text-xs font-bold tracking-[0.25em] uppercase opacity-80">Walk pass</span>
              {title("sm:text-3xl")}
              <div className="grid grid-cols-3 gap-3" suppressHydrationWarning>
                {[
                  ["Date", day],
                  ["Sets off", time],
                  ["Back", formatTime(end)],
                ].map(([label, value]) => (
                  <div className="flex flex-col" key={label}>
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">{label}</span>
                    <span className="truncate text-lg font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex flex-col justify-center gap-1 border-t-2 border-dashed border-white/40 bg-sky-700 p-6 text-center sm:border-t-0 sm:border-l-2" suppressHydrationWarning>
              <span className="text-5xl font-black">{countdown.value}</span>
              <span className="text-xs font-semibold uppercase opacity-80">{countdown.unit}</span>
            </div>
          </section>
          {controls("group")}
          {tabs()}
        </>,
      );

    // ── Organiser dashboard ─────────────────────────────────────────────
    // 47 · Control room: number cards, then who's on the walk beside a list of every action.
    case "controlroom":
      return page(
        <>
          <div className="flex flex-col gap-1">
            {title()}
            {statusLine()}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: status === "in-progress" ? "Time left" : "Countdown", value: countdown.value, sub: countdown.unit },
              { label: "Clocked in", value: p.attended?.count === null || !p.attended ? "—" : String(p.attended.count), sub: "people" },
              { label: "Starts", value: time, sub: day },
              { label: "Journey", value: p.journey ? String(p.journey.count) : "—", sub: "moments" },
            ].map((kpi) => (
              <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm" key={kpi.label}>
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <span className="text-3xl font-bold tracking-tight" suppressHydrationWarning>
                  {kpi.value}
                </span>
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {kpi.sub}
                </span>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="flex min-w-0 flex-col gap-6">
              {p.attended ? sectionCard(p.attended.label, Users, p.attended.content) : p.live}
              {tabs()}
            </div>
            {hasControls ? (
              <aside className="flex flex-col gap-3 rounded-xl border p-4 lg:sticky lg:top-24 lg:self-start">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Actions</span>
                {controls("list")}
              </aside>
            ) : null}
          </div>
        </>,
      );

    // 48 · Admin sheet: attendance first as the main table, the facts in a grid above.
    case "adminsheet":
      return page(
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {title("text-xl sm:text-2xl")}
              {badge()}
            </div>
            {controls("visible")}
          </div>
          {factGrid("lg:grid-cols-8", "rounded-lg bg-transparent border")}
          {p.attended ? sectionCard(p.attended.label, Users, p.attended.content) : null}
          {tabs()}
        </>,
      );

    // 49 · Three panels: the walk, the people and the map side by side.
    case "threepanel":
      return page(
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col">
              {title("text-xl sm:text-2xl")}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {factLine}
              </p>
            </div>
            {controls("group")}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-4">{overview}</div>
            <div className="flex min-w-0 flex-col gap-4">
              {p.attended ? sectionCard(p.attended.label, Users, p.attended.content) : null}
              {p.journey ? sectionCard("Journey", Footprints, p.journey.content) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-4">{route}</div>
          </div>
        </>,
      );

    // 50 · Phases board: before, during and after as columns of real content.
    case "board": {
      const current = status === "completed" ? "after" : status === "in-progress" ? "during" : "before";
      const column = (id: string, heading: string, content: ReactNode) => (
        <section
          className={cn(
            "flex min-w-0 flex-col gap-4 rounded-2xl border p-4",
            id === current ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 dark:bg-emerald-950/30" : "bg-muted/20",
          )}
        >
          <h2 className="flex items-center justify-between text-sm font-semibold">
            {heading}
            {id === current ? <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] text-white">Now</span> : null}
          </h2>
          {content}
        </section>
      );
      return page(
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              {title()}
              {timelineBar}
            </div>
            {controls("menu")}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {column("before", "Before", <>{p.details}{p.before}{p.map}{p.forecast}</>)}
            {column("during", "During", <>{p.live}{p.precise}{p.attended ? p.attended.content : null}</>)}
            {column("after", "After", p.journey ? p.journey.content : <p className="text-sm text-muted-foreground">The journey will appear here.</p>)}
          </div>
        </>,
      );
    }

    // 51 · Command bar: every action along the top as a labelled button.
    case "command":
      return page(
        <>
          {hasControls ? (
            <div className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-2 sm:flex-row sm:flex-wrap sm:items-center">
              {controls("visible")}
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              {title()}
              {badge()}
            </div>
            {timelineBar}
          </div>
          {bigStats("rounded-xl border p-4", "text-3xl")}
          {tabs({ icons: true })}
        </>,
      );

    // 52 · Sidebar app: the sections as a menu with counts down the left.
    case "sidebarapp":
      return page(
        <Tabs className="gap-6 lg:flex-row" onValueChange={setTab} orientation="vertical" value={tab}>
          <aside className="flex flex-col gap-4 lg:w-60 lg:shrink-0">
            <div className="flex flex-col gap-1 rounded-xl border p-3">
              {statusLine("text-xs")}
              <span className="line-clamp-2 font-semibold">{h.title}</span>
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {day} · {time}
              </span>
            </div>
            <TabsList className="h-auto w-full flex-row flex-wrap justify-start lg:flex-col lg:items-stretch">
              {panels.map((panel) => (
                <TabsTrigger className="justify-start" key={panel.value} value={panel.value}>
                  <panel.icon aria-hidden className="size-4" />
                  {panel.label.replace(/ \(\d+\)$/, "")}
                  {panel.count !== undefined && panel.count !== null ? (
                    <span className="ml-auto rounded-full bg-muted px-1.5 text-[11px] tabular-nums">{panel.count}</span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
            {controls("list")}
          </aside>
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            {title()}
            {chips()}
            {panels.map((panel) => (
              <TabsContent className="flex flex-col gap-6" key={panel.value} value={panel.value}>
                {panel.content}
              </TabsContent>
            ))}
          </div>
        </Tabs>,
      );

    // 53 · Cockpit: dense — small type, everything visible in a tight grid.
    case "cockpit":
    default:
      return page(
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b pb-3">
            {title("text-lg sm:text-xl")}
            {badge()}
            {statusLine("text-xs")}
            {note("sm:ml-auto")}
            {controls("group", "sm:ml-auto")}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {facts.map((fact) => (
              <div className="flex min-w-0 flex-col rounded-md border px-2.5 py-2" key={fact.label}>
                <span className="text-[11px] text-muted-foreground">{fact.label}</span>
                <span className="truncate text-sm font-semibold" suppressHydrationWarning>
                  {fact.value}
                </span>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-4">
              {p.live}
              {p.attended ? sectionCard(p.attended.label, Users, p.attended.content, undefined, "p-3 sm:p-4") : p.details}
            </div>
            <div className="flex min-w-0 flex-col gap-4">
              {p.attended ? p.details : null}
              {route}
              {p.journey ? sectionCard("Journey", Footprints, p.journey.content, undefined, "p-3 sm:p-4") : null}
            </div>
          </div>
        </div>,
      );
  }
}
