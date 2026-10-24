"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  CalendarDays,
  Clock,
  Coffee,
  Flag,
  Footprints,
  MapPin,
  Mountain,
  Navigation,
  PanelLeft,
  Timer,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { effectiveEndsAt, walkOpensAt } from "@/lib/walk-window";
import type { WalkStudioLayout } from "@/lib/walk-page-sections";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareLinkButton } from "@/components/share-link";
import { WalkDescription } from "@/components/walk-description";
import { WalkEssentialPills } from "@/components/walk-essentials-context";
import { useWalkNow } from "@/components/walk-header-styles";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import { AddToCalendarButton } from "@/components/add-to-calendar-button";
import { WalkActionsBar, WalkManageMenu } from "@/components/walk-manage-menu";
import { WalkStatusBadge } from "@/components/walk-status-badge";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
type Fact = { icon: Icon; label: string; value: string; wide?: boolean };

type CardOptions = {
  /** The map built into the card, edge to edge. */
  map?: "top" | "side" | "bottom";
  tone?: "card" | "dark" | "plain" | "tint";
  facts?: "grid" | "list" | "table" | "inline";
  /** A strip in the walk's status colour along the top. */
  ribbon?: boolean;
  /** Clock-in opens → set off → finish, as a line. */
  timeline?: boolean;
  bigTitle?: boolean;
  className?: string;
};

/**
 * 30 more walk page designs (Settings → Site wording → Walk page cards →
 * Layout), built to the rules agreed on 12 October 2026:
 *
 * - Messages for members, organisers and owners come first ("Clock-in opens
 *   at 09:15…", finished, cancelled), then one Details card holding
 *   everything from Edit walk — name, status, date, times, meeting point,
 *   what3words, distance, climb, grade, leader, back marker, essentials and
 *   the description — with no boxes inside it.
 * - The walk's actions are always one Manage button (its list: Copy share
 *   link, Add to calendar, Download roster, Duplicate, Cancel walk, Edit,
 *   Remove walk), beside Clock in while that can be used.
 * - A sidebar can always be opened on a phone too.
 * - Some build the map into the Details card edge to edge; some run the full
 *   width of the page like the homepage. No floating docks.
 */
export function WalkStudioLayouts({ layout, parts }: { layout: WalkStudioLayout; parts: WalkIdeaParts }) {
  const p = parts;
  const [tab, setTab] = useState("route");
  const clock = useWalkClock(p.timing);
  const now = useWalkNow(p.timing, p.attended?.count ?? null);
  const h = p.headline;
  const start = new Date(h.startsAt);
  const end = effectiveEndsAt({
    durationMins: p.timing.durationMins,
    endedAt: p.timing.endedAt ? new Date(p.timing.endedAt) : null,
    startsAt: start,
  });
  const opens = walkOpensAt(start);

  const facts: Fact[] = [
    { icon: CalendarDays, label: "Date", value: formatWalkDay(start) },
    { icon: Clock, label: "Starts", value: formatTime(start) },
    { icon: Flag, label: "Finishes", value: formatTime(end) },
    { icon: Timer, label: "Length", value: formatWalkLength(h.durationMins) },
    // Only what's filled in, for everyone.
    ...[
      { icon: MapPin, label: "Meeting point", value: p.meeting, wide: true },
      { icon: Navigation, label: "what3words", value: p.what3words ? `///${p.what3words}` : null },
      { icon: Footprints, label: "Distance", value: h.distance },
      { icon: Mountain, label: "Climb", value: h.elevationGain },
      { icon: TrendingUp, label: "Grade", value: h.grade },
      { icon: UserRound, label: "Walk leader", value: h.walkLeader },
      { icon: UsersRound, label: "Back marker", value: p.walk.backMarker },
      { icon: Coffee, label: "Refreshment stop", value: p.walk.refreshmentStop },
    ].flatMap((fact) =>
      fact.value ? [{ ...fact, value: fact.value }] : [],
    ),
  ];

  // ── Pieces ───────────────────────────────────────────────────────────
  const badge = (
    <WalkStatusBadge
      cancelledAt={h.cancelledAt}
      className="shrink-0"
      durationMins={h.durationMins}
      endedAt={h.endedAt}
      startsAt={h.startsAt}
    />
  );
  const statusLine = (className?: string) => (
    <span className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)} suppressHydrationWarning>
      <span aria-hidden className={cn("size-2 rounded-full", now.live ? "bg-emerald-500" : "bg-muted-foreground/40")} />
      {now.eyebrow} · {now.line}
    </span>
  );
  // Members: no organiser buttons, so their list is sharing and the calendar.
  const memberMenu = (
    <WalkManageMenu label="Share or save">
      <ShareLinkButton url={p.walk.shareUrl} />
      <AddToCalendarButton href={p.walk.calendarHref} timing={p.timing} />
    </WalkManageMenu>
  );
  const actions = (className?: string) =>
    p.share || p.tools ? (
      <WalkActionsBar className={className} liveCompact={p.liveCompact} share={p.share} tools={p.tools} />
    ) : (
      <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)}>{memberMenu}</div>
    );
  const messages = (
    <>
      {p.notices}
      {p.live}
    </>
  );
  const timeline = (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-600"
          style={{
            width: `${Math.min(100, Math.max(0, ((clock.getTime() - opens.getTime()) / (end.getTime() - opens.getTime())) * 100))}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground" suppressHydrationWarning>
        <span>{formatTime(opens)} clock-in opens</span>
        <span>{formatTime(start)} set off</span>
        <span>{formatTime(end)} finish</span>
      </div>
    </div>
  );
  const factsBlock = (kind: CardOptions["facts"] = "grid", dark = false) => {
    const muted = dark ? "text-white/60" : "text-muted-foreground";
    if (kind === "inline")
      return (
        <p className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-sm", dark && "text-white/90")} suppressHydrationWarning>
          {facts.map((fact) => (
            <span className="flex items-center gap-1.5" key={fact.label}>
              <fact.icon aria-hidden className={cn("size-4", muted)} />
              {fact.value}
            </span>
          ))}
        </p>
      );
    if (kind === "list" || kind === "table")
      return (
        <dl className={cn("grid text-sm sm:grid-cols-2 sm:gap-x-8", kind === "table" && "sm:grid-cols-1")}>
          {facts.map((fact) => (
            <div className={cn("flex items-baseline justify-between gap-4 border-b py-2", dark && "border-white/15")} key={fact.label}>
              <dt className={cn("flex shrink-0 items-center gap-2", muted)}>
                <fact.icon aria-hidden className="size-4" />
                {fact.label}
              </dt>
              <dd className="min-w-0 text-right font-medium break-words" suppressHydrationWarning>
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      );
    return (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
        {facts.map((fact) => (
          <div className={cn("flex min-w-0 flex-col gap-0.5", fact.wide && "col-span-2")} key={fact.label}>
            <dt className={cn("flex items-center gap-1.5 text-xs", muted)}>
              <fact.icon aria-hidden className="size-3.5" />
              {fact.label}
            </dt>
            <dd className="text-sm font-semibold break-words" suppressHydrationWarning>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  };
  // The map, flush with the card's edges: its own card's border and corners removed.
  const flushMap = (className?: string) =>
    p.map ? (
      <div
        className={cn(
          "[&_[data-slot=card]]:gap-3 [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:pb-4 [&_[data-slot=card]]:shadow-none",
          className,
        )}
      >
        {p.map}
      </div>
    ) : null;

  /** The one Details card: everything about the walk, nothing boxed inside it. */
  const details = (options: CardOptions = {}) => {
    const dark = options.tone === "dark";
    const body = (
      <div className={cn("flex min-w-0 flex-col gap-5 p-5 sm:p-6", options.bigTitle && "sm:p-8")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {badge}
              {statusLine(dark ? "text-white/80" : undefined)}
            </div>
            <h1
              className={cn(
                "text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl",
                options.bigTitle && "sm:text-4xl",
              )}
            >
              {h.title}
            </h1>
            {h.note ? <p className={cn("text-xs", dark ? "text-white/60" : "text-muted-foreground")}>{h.note}</p> : null}
          </div>
          {actions("sm:shrink-0")}
        </div>
        {options.timeline ? timeline : null}
        {factsBlock(options.facts, dark)}
        <WalkEssentialPills keys={p.walk.essentials} />
        {p.walk.description ? <WalkDescription description={p.walk.description} /> : null}
      </div>
    );
    return (
      <section
        aria-label="Walk details"
        className={cn(
          "overflow-hidden",
          options.tone === "plain" ? "" : "rounded-2xl border",
          options.tone === "dark" && "border-neutral-800 bg-neutral-950 text-white",
          options.tone === "tint" && "bg-muted/40",
          (!options.tone || options.tone === "card") && "bg-card shadow-sm",
          options.className,
        )}
      >
        {options.ribbon ? <div aria-hidden className={cn("h-1.5", now.live ? "bg-emerald-500" : "bg-muted-foreground/30")} /> : null}
        {options.map === "top" ? flushMap("border-b") : null}
        {options.map === "side" && p.map ? (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_24rem]">
            {body}
            {flushMap("border-t lg:border-t-0 lg:border-l")}
          </div>
        ) : (
          body
        )}
        {options.map === "bottom" ? flushMap("border-t") : null}
      </section>
    );
  };

  const mapInCard = (o: CardOptions) => o.map !== undefined && Boolean(p.map);
  const rest = (o: CardOptions = {}) => ({
    route: (
      <>
        {mapInCard(o) ? null : p.map}
        {p.forecast}
        {p.what3words ? null : p.precise}
      </>
    ),
  });
  const panels = (o: CardOptions = {}) => [
    { value: "route", label: mapInCard(o) ? "Weather" : "Map & weather", content: rest(o).route },
    ...(p.before ? [{ value: "before", label: "Before you set off", content: p.before }] : []),
    ...(p.attended ? [{ value: "attended", label: p.attended.label, content: p.attended.content }] : []),
    ...(p.journey ? [{ value: "journey", label: "Journey", content: p.journey.content }] : []),
  ];
  const tabs = (o: CardOptions = {}, listClass?: string) => {
    const list = panels(o);
    const value = list.some((panel) => panel.value === tab) ? tab : list[0].value;
    return (
      <Tabs onValueChange={setTab} value={value}>
        <TabsList className={listClass}>
          {list.map((panel) => (
            <TabsTrigger key={panel.value} value={panel.value}>
              {panel.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {list.map((panel) => (
          <TabsContent className="mt-4 flex flex-col gap-6" key={panel.value} value={panel.value}>
            {panel.content}
          </TabsContent>
        ))}
      </Tabs>
    );
  };
  const accordion = (o: CardOptions = {}) => (
    <Accordion className="rounded-2xl border px-4" defaultValue={["route"]} type="multiple">
      {panels(o).map((panel) => (
        <AccordionItem key={panel.value} value={panel.value}>
          <AccordionTrigger className="text-base">{panel.label}</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4">{panel.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
  const stacked = (o: CardOptions = {}, headings = true) => (
    <>
      {panels(o).map((panel) => (
        <section className="flex scroll-mt-28 flex-col gap-4" id={`walk-${panel.value}`} key={panel.value}>
          {headings ? <h2 className="text-lg font-semibold">{panel.label}</h2> : null}
          {panel.content}
        </section>
      ))}
    </>
  );
  const sectionNav = (o: CardOptions = {}) => (
    <nav aria-label="On this page" className="flex flex-col gap-0.5 text-sm">
      {panels(o).map((panel) => (
        <a
          className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          href={`#walk-${panel.value}`}
          key={panel.value}
        >
          {panel.label}
        </a>
      ))}
    </nav>
  );
  const page = (children: ReactNode, className?: string) => (
    <div className={cn("flex flex-col gap-6", className)}>
      {messages}
      {children}
    </div>
  );
  /** Out to the page's edges, like the homepage's full-width sections. */
  const bleed = (children: ReactNode, className?: string) => (
    <div className={cn("-mx-4 md:-mx-6", className)}>{children}</div>
  );
  const inner = "px-4 md:px-6";

  switch (layout) {
    // ── Map built into the Details card ───────────────────────────────
    case "s01": // Map on top, edge to edge, then tabs.
      return page(<>{details({ map: "top" })}{tabs({ map: "top" })}</>);
    case "s02": // Map down the right of the card on a computer.
      return page(<>{details({ map: "side", facts: "list" })}{tabs({ map: "side" })}</>);
    case "s03": // Map along the bottom of the card, then folding sections.
      return page(<>{details({ map: "bottom", facts: "inline" })}{accordion({ map: "bottom" })}</>);
    case "s04": // Map on top with a status ribbon and the day's timeline.
      return page(<>{details({ map: "top", ribbon: true, timeline: true })}{stacked({ map: "top" })}</>);
    case "s05": // Map beside a definition list; sections stacked below.
      return page(<>{details({ map: "side", facts: "table" })}{stacked({ map: "side" })}</>);
    case "s06": // Tinted card with the map on top, tabs full width.
      return page(<>{details({ map: "top", tone: "tint", facts: "list" })}{tabs({ map: "top" }, "w-full")}</>);

    // ── Full width, edge to edge ──────────────────────────────────────
    case "s07": // The map across the whole page, the card overlapping it.
      return page(
        <>
          {p.map ? bleed(flushMap("[&_[data-slot=card]]:pb-0"), "") : null}
          <div className={cn("relative z-10", p.map && "-mt-24 sm:-mt-32")}>{details({ facts: "grid", className: "shadow-xl" })}</div>
          {tabs({ map: "top" })}
        </>,
      );
    case "s08": // A dark band across the page holding all the details.
      return page(
        <>
          {bleed(<div className={cn("bg-neutral-950 py-8 text-white", inner)}>{details({ tone: "plain", facts: "list", className: "text-white [&_.text-muted-foreground]:text-white/60" })}</div>)}
          {tabs()}
        </>,
      );
    case "s09": // A band in the walk's status colour, then the card on a plain page.
      return page(
        <>
          {bleed(<div aria-hidden className={cn("h-3", now.live ? "bg-emerald-500" : "bg-muted-foreground/30")} />)}
          {details({ facts: "grid", bigTitle: true })}
          {stacked()}
        </>,
      );
    case "s10": // Full-width sections, each on its own background like the homepage.
      return page(
        <>
          {details({ map: "top" })}
          {panels({ map: "top" }).map((panel, i) => (
            <section
              className={cn("-mx-4 flex flex-col gap-4 py-8 md:-mx-6", inner, i % 2 === 0 ? "bg-muted/40" : "")}
              id={`walk-${panel.value}`}
              key={panel.value}
            >
              <h2 className="text-lg font-semibold">{panel.label}</h2>
              {panel.content}
            </section>
          ))}
        </>,
      );
    case "s11": // Half details, half map, the whole width of the page.
      return page(
        <>
          {bleed(
            <div className="grid border-y lg:grid-cols-2">
              <div className={cn("py-6", inner)}>{details({ tone: "plain", facts: "list" })}</div>
              {flushMap("lg:border-l")}
            </div>,
          )}
          {tabs({ map: "side" })}
        </>,
      );
    case "s12": // A thin full-width bar with the name and Manage that stays at the top.
      return page(
        <>
          {bleed(
            <div className={cn("sticky top-16 z-20 flex items-center justify-between gap-3 border-y bg-background/95 py-2 backdrop-blur-sm", inner)}>
              <span className="truncate text-sm font-semibold">{h.title}</span>
              {actions("sm:shrink-0 [&>*]:w-auto")}
            </div>,
          )}
          {details({ facts: "grid" })}
          {stacked()}
        </>,
      );
    case "s13": // The map wide and tall, the card beside it on a computer.
      return page(
        <>
          {bleed(
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
              {flushMap()}
              <div className={cn("py-6 lg:border-l", inner)}>{details({ tone: "plain", facts: "table" })}</div>
            </div>,
            "border-y",
          )}
          {tabs({ map: "side" })}
        </>,
      );
    case "s14": // A full-width strip of the key numbers under the card.
      return page(
        <>
          {details({ facts: "inline" })}
          {bleed(
            <dl className={cn("grid grid-cols-2 gap-px border-y bg-border sm:grid-cols-4")}>
              {facts.slice(0, 4).map((fact) => (
                <div className={cn("flex flex-col gap-1 bg-background py-5", inner)} key={fact.label}>
                  <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                  <dd className="text-2xl font-bold tracking-tight" suppressHydrationWarning>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>,
          )}
          {tabs()}
        </>,
      );

    // ── With a sidebar (opens on a phone too) ─────────────────────────
    case "s15": // Sections menu on the left.
      return page(
        <>
          {details({ facts: "grid" })}
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <Sidebar label="Sections">{sectionNav()}</Sidebar>
            <div className="flex min-w-0 flex-col gap-8">{stacked()}</div>
          </div>
        </>,
      );
    case "s16": // People and journey in a sidebar on the right.
      return page(
        <>
          {details({ map: "top" })}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-w-0 flex-col gap-6">
              {rest({ map: "top" }).route}
              {p.before}
            </div>
            {p.attended || p.journey ? (
              <Sidebar label={p.attended ? `${p.attended.label} & journey` : "Journey"} side="right">
                <div className="flex flex-col gap-6">
                  {p.attended?.content}
                  {p.journey?.content}
                </div>
              </Sidebar>
            ) : null}
          </div>
        </>,
      );
    case "s17": // An organiser panel on the right: Manage, counts, and links.
      return page(
        <>
          {details({ facts: "list" })}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div className="flex min-w-0 flex-col gap-8">{stacked()}</div>
            <Sidebar label="Walk panel" side="right">
              <div className="flex flex-col gap-4">
                {actions("[&>*]:w-full sm:flex-col sm:items-stretch")}
                <dl className="flex flex-col divide-y rounded-xl border text-sm">
                  {p.attended?.count !== null && p.attended ? (
                    <div className="flex justify-between px-3 py-2">
                      <dt className="text-muted-foreground">Clocked in</dt>
                      <dd className="font-semibold">{p.attended.count}</dd>
                    </div>
                  ) : null}
                  {p.journey ? (
                    <div className="flex justify-between px-3 py-2">
                      <dt className="text-muted-foreground">Journey moments</dt>
                      <dd className="font-semibold">{p.journey.count}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between px-3 py-2" suppressHydrationWarning>
                    <dt className="text-muted-foreground">Clock-in opens</dt>
                    <dd className="font-semibold">{formatTime(opens)}</dd>
                  </div>
                </dl>
                {sectionNav()}
              </div>
            </Sidebar>
          </div>
        </>,
      );
    case "s18": // Like an inbox: pick a section on the left, it shows on the right.
      return page(
        <>
          {details({ facts: "inline" })}
          <Tabs className="gap-6 lg:flex-row" onValueChange={setTab} orientation="vertical" value={panels().some((x) => x.value === tab) ? tab : "route"}>
            <Sidebar label="Sections">
              <TabsList className="h-auto w-full flex-col items-stretch lg:w-52">
                {panels().map((panel) => (
                  <TabsTrigger className="justify-start" key={panel.value} value={panel.value}>
                    {panel.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Sidebar>
            <div className="min-w-0 flex-1">
              {panels().map((panel) => (
                <TabsContent className="flex flex-col gap-6" key={panel.value} value={panel.value}>
                  {panel.content}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </>,
      );
    case "s19": // A contents list that stays in view, map in the card.
      return page(
        <>
          {details({ map: "side" })}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="flex min-w-0 flex-col gap-8">{stacked({ map: "side" })}</div>
            <Sidebar label="On this page" side="right">
              <div className="lg:sticky lg:top-24">{sectionNav({ map: "side" })}</div>
            </Sidebar>
          </div>
        </>,
      );
    case "s20": // The details card itself in a left sidebar on a computer.
      return page(
        <div className="grid gap-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-24 lg:self-start">{details({ facts: "table" })}</div>
          <div className="flex min-w-0 flex-col gap-6">{tabs()}</div>
        </div>,
      );

    // ── Compact and neat ──────────────────────────────────────────────
    case "s21": // Two-column list of details, folding sections.
      return page(<>{details({ facts: "list" })}{accordion()}</>);
    case "s22": // Icons and values in a grid, underline tabs.
      return page(<>{details({ facts: "grid", ribbon: true })}{tabs()}</>);
    case "s23": // A neat table of details, then each part with a heading.
      return page(<>{details({ facts: "table" })}{stacked()}</>);
    case "s24": // The day's timeline in the card, tabs below.
      return page(<>{details({ facts: "inline", timeline: true })}{tabs()}</>);
    case "s25": // No border, just lines — the quietest.
      return page(
        <>
          {details({ tone: "plain", facts: "list", className: "border-b pb-2" })}
          {stacked({}, true)}
        </>,
      );
    case "s26": // Description first, big title, details after.
      return page(<>{details({ bigTitle: true, facts: "list", tone: "tint" })}{tabs()}</>);
    case "s27": // Card and sections side by side on a wide screen.
      return page(
        <div className="grid gap-6 xl:grid-cols-2">
          {details({ facts: "list", map: "bottom" })}
          <div className="flex min-w-0 flex-col gap-6">{tabs({ map: "bottom" })}</div>
        </div>,
      );
    case "s28": // Status ribbon, map on top, folding sections.
      return page(<>{details({ map: "top", ribbon: true, facts: "inline" })}{accordion({ map: "top" })}</>);
    case "s29": // Dark card, light page.
      return page(<>{details({ tone: "dark", facts: "list" })}{tabs()}</>);
    case "s30": // Compact everything: small card, sections as tabs filling the width.
    default:
      return page(
        <>
          {details({ facts: "inline", className: "[&_h1]:text-xl [&_h1]:sm:text-2xl" })}
          {tabs({}, "w-full")}
        </>,
      );
  }
}

/**
 * A sidebar that sits beside the page on a computer and, on a phone, opens
 * from a button as a panel over the page (closes with the ✕, a tap outside,
 * or Escape). Rendered once, so anything inside keeps working either way.
 */
function Sidebar({ children, label, side = "left" }: { children: ReactNode; label: string; side?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <Button className="w-full lg:hidden" onClick={() => setOpen(true)} size="sm" type="button" variant="outline">
        <PanelLeft data-icon="inline-start" />
        {label}
      </Button>
      {open ? <div aria-hidden className="fixed inset-0 z-[70] bg-black/40 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <aside
        aria-label={label}
        className={cn(
          "lg:static lg:block lg:min-w-0",
          open
            ? cn(
                "fixed inset-y-0 z-[71] block w-80 max-w-[85vw] overflow-y-auto bg-background p-4 shadow-xl lg:w-auto lg:bg-transparent lg:p-0 lg:shadow-none",
                side === "right" ? "right-0" : "left-0",
              )
            : "hidden",
        )}
      >
        {open ? (
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <span className="text-sm font-semibold">{label}</span>
            <Button aria-label="Close" onClick={() => setOpen(false)} size="icon" type="button" variant="ghost">
              <X />
            </Button>
          </div>
        ) : null}
        {children}
      </aside>
    </>
  );
}
