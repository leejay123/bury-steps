"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { effectiveEndsAt, walkOpensAt, walkStatus } from "@/lib/walk-window";
import type { WalkIdeaLayout } from "@/lib/walk-page-sections";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalkNow, type WalkTiming } from "@/components/walk-header-styles";
import { walkHeadlineFacts, type WalkHeadlineProps } from "@/components/walk-headline";
import { WalkActionsBar, WalkManageMenu } from "@/components/walk-manage-menu";
import { WalkStatusBadge } from "@/components/walk-status-badge";

export type WalkIdeaParts = {
  /** Organisers' Attended list, with its label and count (where allowed). */
  attended: { label: string; count: number | null; content: ReactNode } | null;
  /** Before you set off (members), or null. */
  before: ReactNode;
  /** The walk's fact tiles and description. */
  details: ReactNode;
  forecast: ReactNode;
  headline: Omit<WalkHeadlineProps, "action">;
  journey: { count: number; content: ReactNode } | null;
  /** Clock-in panel (organiser) or the member's live part. */
  live: ReactNode;
  /** Just the Clock in button (organisers), while it can be used. */
  liveCompact?: ReactNode;
  map: ReactNode;
  meeting: string | null;
  notices: ReactNode;
  precise: ReactNode;
  share?: ReactNode;
  timing: WalkTiming;
  /** The walk's buttons (organisers). */
  tools?: ReactNode;
  /** How this group works (signed-out visitors), where the page has it. */
  howItWorks?: ReactNode;
  /** The Before you set off tips, for the Checklist design. */
  tips: readonly string[];
  what3words: string | null;
  /** Everything else from Edit walk, for the one-card Details (walk-studio-layouts.tsx). */
  walk: {
    backMarker: string | null;
    calendarHref: string;
    description: string | null;
    essentials: string[];
    location: string | null;
    postcode: string | null;
    shareUrl: string;
  };
};

type Panel = { value: string; label: string; content: ReactNode };

/**
 * The 20 further walk page designs (Settings → Site wording → Walk page
 * cards → Layout, 1 to 20), the same for members and organisers. Every
 * design is built from the same parts the other layouts use — the walk's
 * details, map, forecast, precise location, clock-in, who attended and the
 * Journey — only arranged differently. Organisers' controls go in the
 * buttons row and its Manage list; members simply don't have them.
 */
export function WalkIdeaLayouts({ layout, parts }: { layout: WalkIdeaLayout; parts: WalkIdeaParts }) {
  const [tab, setTab] = useState("overview");
  const p = parts;
  const facts = walkHeadlineFacts(p.headline);
  const factLine = facts.join(" · ");
  const now = useWalkNow(p.timing, p.attended?.count ?? null);
  const start = new Date(p.headline.startsAt);
  const end = effectiveEndsAt({
    durationMins: p.timing.durationMins,
    endedAt: p.timing.endedAt ? new Date(p.timing.endedAt) : null,
    startsAt: start,
  });

  const badge = (
    <WalkStatusBadge
      cancelledAt={p.headline.cancelledAt}
      className="shrink-0"
      durationMins={p.headline.durationMins}
      endedAt={p.headline.endedAt}
      startsAt={p.headline.startsAt}
    />
  );
  const statusLine = (
    <span
      className={cn("text-sm font-semibold", now.live ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}
      suppressHydrationWarning
    >
      {now.eyebrow} · {now.line}
    </span>
  );
  const title = (className?: string) => (
    <h1 className={cn("text-2xl leading-tight font-semibold sm:text-3xl", className)}>{p.headline.title}</h1>
  );
  const note = p.headline.note ? <p className="text-xs text-muted-foreground">{p.headline.note}</p> : null;
  const manage = (label = "Manage") =>
    p.share || p.tools ? (
      <WalkManageMenu
        label={
          <>
            {label}
            <ChevronDown data-icon="inline-end" />
          </>
        }
      >
        {p.share}
        {p.tools}
      </WalkManageMenu>
    ) : null;
  // The usual buttons: Clock in (when it can be used), then Manage. Full width on a phone.
  const buttons = (className?: string) => (
    <WalkActionsBar className={className} liveCompact={p.liveCompact} share={p.share} tools={p.tools} />
  );

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
  const panels = (include: { overview?: ReactNode; route?: ReactNode; weather?: boolean; map?: boolean; attended?: boolean } = {}) => {
    const list: Panel[] = [{ value: "overview", label: "Overview", content: include.overview ?? overview }];
    if (include.map) list.push({ value: "map", label: "Map", content: <>{p.map}{p.precise}</> });
    if (include.weather) list.push({ value: "weather", label: "Weather", content: p.forecast });
    if (!include.map && !include.weather) list.push({ value: "route", label: "Map & weather", content: include.route ?? route });
    if (p.attended && include.attended !== false) list.push({ value: "attended", label: p.attended.label, content: p.attended.content });
    if (p.journey) list.push({ value: "journey", label: "Journey", content: p.journey.content });
    return list;
  };
  const tabs = (list: Panel[], options: { listClassName?: string; triggerClassName?: string; extra?: ReactNode } = {}) => (
    <Tabs onValueChange={setTab} value={list.some((panel) => panel.value === tab) ? tab : list[0].value}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <TabsList className={options.listClassName}>
          {list.map((panel) => (
            <TabsTrigger className={options.triggerClassName} key={panel.value} value={panel.value}>
              {panel.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {options.extra}
      </div>
      {list.map((panel) => (
        <TabsContent className="mt-4 flex flex-col gap-6" key={panel.value} value={panel.value}>
          {panel.content}
        </TabsContent>
      ))}
    </Tabs>
  );
  // Everything one after another, with a heading each — the designs without tabs.
  const stacked = (
    <>
      {p.live}
      {p.details}
      {p.before}
      {route}
      {p.attended ? (
        <section className="flex scroll-mt-28 flex-col gap-3" id="walk-attended">
          {p.attended.content}
        </section>
      ) : null}
      {p.journey ? (
        <section className="flex scroll-mt-28 flex-col gap-3" id="walk-journey">
          {p.journey.content}
        </section>
      ) : null}
    </>
  );

  switch (layout) {
    // 1 · A narrow column: the facts as a plain list, then everything in turn.
    case "minimal":
      return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-4">
            {title("sm:text-4xl")}
            <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-y-2 text-sm sm:grid-cols-[9rem_minmax(0,1fr)] sm:text-base">
              <dt className="text-muted-foreground">Status</dt>
              <dd suppressHydrationWarning>
                {now.eyebrow} · {now.line}
              </dd>
              <dt className="text-muted-foreground">When</dt>
              <dd suppressHydrationWarning>
                {formatWalkDay(start)}, {formatTime(start)} to {formatTime(end)}
              </dd>
              {p.meeting ? (
                <>
                  <dt className="text-muted-foreground">Meet at</dt>
                  <dd>
                    {p.meeting}
                    {p.what3words ? ` · ///${p.what3words}` : ""}
                  </dd>
                </>
              ) : null}
              {p.headline.distance || p.headline.grade ? (
                <>
                  <dt className="text-muted-foreground">Walk</dt>
                  <dd>{[p.headline.distance, p.headline.grade, p.headline.elevationGain].filter(Boolean).join(" · ")}</dd>
                </>
              ) : null}
              {p.headline.walkLeader ? (
                <>
                  <dt className="text-muted-foreground">Leader</dt>
                  <dd>{p.headline.walkLeader}</dd>
                </>
              ) : null}
            </dl>
            {note}
            {buttons()}
          </div>
          <hr />
          {stacked}
        </div>
      );

    // 2 · The map across the top, with the title card over its bottom edge.
    case "maphero":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col">
            {p.map ? <div className="[&_[data-slot=card]]:rounded-b-none">{p.map}</div> : null}
            <section
              className={cn(
                "relative z-10 mx-auto flex w-[calc(100%-1.5rem)] flex-col gap-4 rounded-xl border bg-background p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-5",
                p.map ? "-mt-10" : "",
              )}
            >
              <div className="flex min-w-0 flex-col gap-1">
                {statusLine}
                {title("sm:text-2xl")}
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                  {factLine}
                </p>
              </div>
              {buttons()}
            </section>
          </div>
          {tabs(panels({ weather: true, map: false, route: <>{p.forecast}{p.precise}</> }).map((panel) =>
            panel.value === "route" ? { ...panel, label: "Weather" } : panel,
          ))}
        </div>
      );

    // 3 · A line through the day: clock-in opens, set off, now, finish.
    case "timeline":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {facts.filter((fact, i) => i !== 1 && i !== 2).join(" · ")}
              </p>
              {note}
            </div>
            {buttons()}
          </div>
          <DayTimeline timing={p.timing} />
          {tabs(panels())}
        </div>
      );

    // 4 · A walk pass: the facts like a ticket, the buttons on its stub.
    case "ticket":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <section className="grid overflow-hidden rounded-2xl border bg-card shadow-sm sm:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <span className="text-xs font-semibold tracking-widest text-muted-foreground">WALK PASS</span>
              {title()}
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  ["Date", formatWalkDay(start)],
                  ["Sets off", formatTime(start)],
                  ["Back by", formatTime(end)],
                  ["Meet at", p.meeting],
                  ["Distance", p.headline.distance],
                  ["Leader", p.headline.walkLeader],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div className="flex min-w-0 flex-col" key={label}>
                      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</dt>
                      <dd className="truncate text-lg font-semibold" suppressHydrationWarning>
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>
              {note}
            </div>
            <div className="flex flex-col justify-between gap-3 border-t-2 border-dashed p-5 sm:border-t-0 sm:border-l-2">
              {statusLine}
              {buttons()}
            </div>
          </section>
          {tabs(panels())}
        </div>
      );

    // 5 · Four big numbers: time left, clocked in, distance, climb.
    case "bignumbers":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {title()}
            {buttons()}
          </div>
          <BigNumbers attended={p.attended?.count ?? null} headline={p.headline} timing={p.timing} />
          <p className="text-sm text-muted-foreground sm:text-base" suppressHydrationWarning>
            {formatWalkDay(start)} · {formatTime(start)} to {formatTime(end)}
            {p.meeting ? ` · Meet at ${p.meeting}` : ""}
            {p.headline.walkLeader ? ` · Led by ${p.headline.walkLeader}` : ""}
          </p>
          {tabs(panels())}
        </div>
      );

    // 6 · The map down one side, everything else beside it.
    case "mapside":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
              {p.map}
              {p.precise}
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              {statusLine}
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {factLine}
              </p>
              {note}
              {buttons()}
              {tabs(panels({ weather: true }).filter((panel) => panel.value !== "route"))}
            </div>
          </div>
        </div>
      );

    // 7 · The sections in a menu down the left (along the top on a phone).
    case "rail":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <Tabs className="gap-6 lg:flex-row" onValueChange={setTab} orientation="vertical" value={tab}>
            <div className="flex flex-col gap-4 lg:w-52 lg:shrink-0">
              <TabsList className="h-auto w-full flex-row flex-wrap justify-start lg:flex-col lg:items-stretch">
                {panels().map((panel) => (
                  <TabsTrigger className="justify-start" key={panel.value} value={panel.value}>
                    {panel.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {manage("Manage walk")}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  {statusLine}
                  {title()}
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                    {factLine}
                  </p>
                  {note}
                </div>
                {p.liveCompact ? <div className="flex flex-col sm:flex-row">{p.liveCompact}</div> : null}
              </div>
              {panels().map((panel) => (
                <TabsContent className="flex flex-col gap-6" key={panel.value} value={panel.value}>
                  {panel.content}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      );

    // 8 · Everything in fold-out rows; the walk's details start open.
    case "folded":
      return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              {title()}
              {statusLine}
            </div>
            {p.liveCompact ? <div className="flex flex-col sm:flex-row">{p.liveCompact}</div> : null}
          </div>
          {p.live}
          <Accordion className="rounded-xl border" defaultValue={["details"]} type="multiple">
            {[
              { value: "details", label: "Walk details", content: <>{p.details}{p.before}</> },
              { value: "map", label: "Map and directions", content: <>{p.map}{p.precise}</> },
              { value: "weather", label: "Weather", content: p.forecast },
              ...(p.attended ? [{ value: "attended", label: p.attended.label, content: p.attended.content }] : []),
              ...(p.journey ? [{ value: "journey", label: "Journey", content: p.journey.content }] : []),
              ...(p.share || p.tools
                ? [{ value: "manage", label: "Manage this walk", content: <WalkActionsBar share={p.share} tools={p.tools} /> }]
                : []),
            ].map((row) => (
              <AccordionItem className="px-4" key={row.value} value={row.value}>
                <AccordionTrigger className="text-base">{row.label}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-4">{row.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      );

    // 9 · Three columns for before, during and after; the current one stands out.
    case "phases": {
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {factLine}
              </p>
            </div>
            {buttons()}
          </div>
          <Phases attended={p.attended !== null} journey={p.journey !== null} onOpen={setTab} timing={p.timing} />
          {tabs(panels())}
        </div>
      );
    }

    // 10 · Like a maps app: the map, with the walk in a sheet over it.
    case "sheet":
      return (
        <div className="flex flex-col">
          {p.notices ? <div className="mb-6 flex flex-col gap-6">{p.notices}</div> : null}
          {p.map}
          <section className={cn("relative z-10 flex flex-col gap-4 rounded-t-3xl border-x border-t bg-background px-4 pt-3 pb-2 sm:px-6", p.map ? "-mt-8" : "")}>
            <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30" />
            {statusLine}
            {title("sm:text-2xl")}
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {factLine}
            </p>
            {buttons()}
            {tabs(panels({ weather: true }).filter((panel) => panel.value !== "route").map((panel) =>
              panel.value === "weather" ? { ...panel, content: <>{p.forecast}{p.precise}</> } : panel,
            ))}
          </section>
        </div>
      );

    // 11 · A calendar page for the date beside the title.
    case "calendar":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div aria-hidden className="w-24 shrink-0 overflow-hidden rounded-xl border text-center">
              <div className="bg-destructive py-1 text-xs font-semibold text-white uppercase" suppressHydrationWarning>
                {start.toLocaleString("en-GB", { month: "short", timeZone: "Europe/London" })}
              </div>
              <div className="pt-1 text-4xl font-bold" suppressHydrationWarning>
                {start.toLocaleString("en-GB", { day: "numeric", timeZone: "Europe/London" })}
              </div>
              <div className="pb-2 text-xs text-muted-foreground" suppressHydrationWarning>
                {start.toLocaleString("en-GB", { weekday: "long", timeZone: "Europe/London" })}
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {formatTime(start)} to {formatTime(end)}
                {p.meeting ? ` · Meet at ${p.meeting}` : ""}
                {p.headline.walkLeader ? ` · Led by ${p.headline.walkLeader}` : ""}
              </p>
              {statusLine}
            </div>
            {buttons()}
          </div>
          {tabs(panels())}
        </div>
      );

    // 12 · A "Ready to go?" tick list first (ticks stay on this device only, for now).
    case "checklist":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-1">
            {title()}
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {now.eyebrow} · {factLine}
            </p>
            {note}
          </div>
          <section className="flex flex-col gap-3 rounded-xl border p-4 sm:p-5">
            <h2 className="font-semibold">Ready to go?</h2>
            <ul className="flex flex-col gap-2">
              {(p.tips.length > 0 ? p.tips : ["Boots and a waterproof", "Water and a snack", "Checked the weather"]).map((tip) => (
                <li key={tip}>
                  <label className="flex items-start gap-3 text-sm">
                    <input className="mt-0.5 size-4 accent-foreground" type="checkbox" />
                    {tip}
                  </label>
                </li>
              ))}
            </ul>
            {buttons()}
          </section>
          {tabs(panels({ overview: <>{p.live}{p.details}</> }))}
        </div>
      );

    // 13 · Who's on the walk first (organisers); members see their clock-in first.
    case "people":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {now.eyebrow} · {factLine}
              </p>
            </div>
            {buttons()}
          </div>
          {p.attended ? (
            <section className="flex flex-col gap-3 rounded-xl border p-4 sm:p-5">{p.attended.content}</section>
          ) : (
            p.live
          )}
          {tabs(panels({ attended: false, overview: p.attended ? overview : <>{p.details}{p.before}</> }))}
        </div>
      );

    // 14 · The weather first.
    case "weather":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {now.eyebrow} · {factLine}
              </p>
            </div>
            {buttons()}
          </div>
          {p.forecast}
          {tabs(panels({ map: true }).filter((panel) => panel.value !== "weather"))}
        </div>
      );

    // 15 · Like a magazine article: a big serif title and the description up front.
    case "magazine":
      return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          {p.notices}
          <span className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase" suppressHydrationWarning>
            {formatWalkDay(start)} walk
          </span>
          <h1 className="font-serif text-4xl leading-[1.05] font-semibold sm:text-5xl">{p.headline.title}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-y py-3 text-sm" suppressHydrationWarning>
            <span>
              <strong>{formatTime(start)}</strong> start
            </span>
            <span>
              <strong>{formatWalkLength(p.headline.durationMins)}</strong>
            </span>
            {p.meeting ? (
              <span>
                <strong>{p.meeting}</strong> meet
              </span>
            ) : null}
            {p.headline.grade ? (
              <span>
                <strong>{p.headline.grade}</strong> grade
              </span>
            ) : null}
            <span className="sm:ml-auto">{statusLine}</span>
          </div>
          {buttons()}
          {tabs(panels())}
        </div>
      );

    // 16 · A dark band across the top.
    case "dark":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <Tabs onValueChange={setTab} value={tab}>
            <section className="flex flex-col gap-4 rounded-xl bg-neutral-950 p-4 text-neutral-50 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2">
                  {badge}
                  {title()}
                  <p className="text-sm text-neutral-300" suppressHydrationWarning>
                    {factLine}
                  </p>
                  {note}
                </div>
                {buttons()}
              </div>
            </section>
            {/* Just under the band: in it, the tab words would be dark on dark. */}
            <TabsList className="mt-4">
              {panels().map((panel) => (
                <TabsTrigger key={panel.value} value={panel.value}>
                  {panel.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {panels().map((panel) => (
              <TabsContent className="mt-6 flex flex-col gap-6" key={panel.value} value={panel.value}>
                {panel.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      );

    // 17 · A four-step bar: Upcoming, Clock-in open, In progress, Finished.
    case "stepper":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <Stepper timing={p.timing} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {factLine}
              </p>
              {note}
            </div>
            {buttons()}
          </div>
          {tabs(panels())}
        </div>
      );

    // 19 · Boxes of different sizes, each a summary that jumps to its part below.
    case "bento":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="grid gap-3 sm:grid-cols-4">
            <section className="flex flex-col gap-1 rounded-2xl bg-muted/60 p-5 sm:col-span-3">
              {statusLine}
              {title("sm:text-2xl")}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {formatWalkDay(start)}, {formatTime(start)} to {formatTime(end)}
                {p.headline.walkLeader ? ` · Led by ${p.headline.walkLeader}` : ""}
              </p>
            </section>
            <section className="flex flex-col justify-between gap-3 rounded-2xl bg-foreground p-4 text-background [&_button]:w-full">
              <span className="text-sm opacity-70">You</span>
              {p.liveCompact ?? <span className="text-sm">{now.eyebrow}</span>}
            </section>
            <BentoTile href="#walk-route" label="Meeting point" value={p.meeting ?? "—"} sub={p.what3words ? `///${p.what3words}` : "Map and directions"} wide />
            {p.attended ? (
              <BentoTile href="#walk-attended" label="Attended" value={p.attended.count === null ? "See who" : String(p.attended.count)} sub="See who" />
            ) : null}
            <BentoTile href="#walk-route" label="Walk" value={[p.headline.distance, p.headline.grade].filter(Boolean).join(" · ") || "—"} sub={p.headline.elevationGain ?? undefined} />
            {p.journey ? <BentoTile href="#walk-journey" label="Journey" value={`${p.journey.count}`} sub="moments" /> : null}
            {p.share || p.tools ? (
              <section className="flex flex-col gap-2 rounded-2xl border p-4">
                <span className="text-sm text-muted-foreground">Manage</span>
                {manage("Open")}
              </section>
            ) : null}
          </div>
          {p.live}
          {p.details}
          {p.before}
          <section className="flex scroll-mt-28 flex-col gap-6" id="walk-route">
            {route}
          </section>
          {p.attended ? (
            <section className="flex scroll-mt-28 flex-col gap-3" id="walk-attended">
              {p.attended.content}
            </section>
          ) : null}
          {p.journey ? (
            <section className="flex scroll-mt-28 flex-col gap-3" id="walk-journey">
              {p.journey.content}
            </section>
          ) : null}
        </div>
      );

    // 21 · A ring that fills as the walk goes, with the time left in it.
    case "ring":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <CountdownRing timing={p.timing} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {statusLine}
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {factLine}
              </p>
              {note}
              {buttons()}
            </div>
          </div>
          {tabs(panels())}
        </div>
      );

    // 23 · A coloured block with the time and day beside the title.
    case "split":
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <section className="grid overflow-hidden rounded-xl border sm:grid-cols-[13rem_minmax(0,1fr)]">
            <div className={cn("flex flex-col justify-center gap-1 p-5", now.tone)} suppressHydrationWarning>
              <span className="text-xs font-semibold tracking-wider uppercase">{now.eyebrow}</span>
              <span className="text-4xl leading-none font-bold">{formatTime(start)}</span>
              <span className="text-sm">{formatWalkDay(start)}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-3 p-5">
              {title()}
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {facts.slice(2).join(" · ")}
              </p>
              {note}
              {buttons()}
            </div>
          </section>
          {tabs(panels())}
        </div>
      );

    // 20 · Everything in one neat table, then the parts in turn.
    case "spec":
    default:
      return (
        <div className="flex flex-col gap-6">
          {p.notices}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {title()}
            {buttons()}
          </div>
          <table className="w-full text-sm">
            <tbody className="[&_th]:w-40 [&_th]:py-2.5 [&_th]:pr-4 [&_th]:text-left [&_th]:align-top [&_th]:font-normal [&_th]:text-muted-foreground [&_tr]:border-t [&_tr:last-child]:border-b [&_td]:py-2.5">
              <tr>
                <th scope="row">Status</th>
                <td suppressHydrationWarning>
                  {now.eyebrow} · {now.line}
                </td>
              </tr>
              <tr>
                <th scope="row">Date and time</th>
                <td suppressHydrationWarning>
                  {formatWalkDay(start)}, {formatTime(start)} to {formatTime(end)}
                </td>
              </tr>
              {p.meeting ? (
                <tr>
                  <th scope="row">Meeting point</th>
                  <td>
                    {p.meeting}
                    {p.what3words ? ` · ///${p.what3words}` : ""} ·{" "}
                    <a className="underline" href="#walk-route">
                      Map
                    </a>
                  </td>
                </tr>
              ) : null}
              {p.headline.distance || p.headline.elevationGain ? (
                <tr>
                  <th scope="row">Distance and climb</th>
                  <td>{[p.headline.distance, p.headline.elevationGain].filter(Boolean).join(" · ")}</td>
                </tr>
              ) : null}
              {p.headline.grade ? (
                <tr>
                  <th scope="row">Grade</th>
                  <td>{p.headline.grade}</td>
                </tr>
              ) : null}
              {p.headline.walkLeader ? (
                <tr>
                  <th scope="row">Walk leader</th>
                  <td>{p.headline.walkLeader}</td>
                </tr>
              ) : null}
              {p.attended ? (
                <tr>
                  <th scope="row">Attended</th>
                  <td>
                    {p.attended.count ?? ""}{" "}
                    <a className="underline" href="#walk-attended">
                      See who
                    </a>
                  </td>
                </tr>
              ) : null}
              {p.headline.note ? (
                <tr>
                  <th scope="row">Created by</th>
                  <td>{String(p.headline.note).replace(/^Created by /, "")}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {p.live}
          {p.details}
          {p.before}
          <section className="flex scroll-mt-28 flex-col gap-6" id="walk-route">
            {route}
          </section>
          {p.attended ? (
            <section className="flex scroll-mt-28 flex-col gap-3" id="walk-attended">
              {p.attended.content}
            </section>
          ) : null}
          {p.journey ? (
            <section className="flex scroll-mt-28 flex-col gap-3" id="walk-journey">
              {p.journey.content}
            </section>
          ) : null}
        </div>
      );
  }
}

/** 3: clock-in opens → set off → now → finish, on one line that fills as the walk goes. */
function DayTimeline({ timing }: { timing: WalkTiming }) {
  const now = useWalkClock(timing);
  const start = new Date(timing.startsAt);
  const opens = walkOpensAt(start);
  const end = effectiveEndsAt({ durationMins: timing.durationMins, endedAt: timing.endedAt ? new Date(timing.endedAt) : null, startsAt: start });
  const span = end.getTime() - opens.getTime();
  const at = (date: Date) => Math.min(100, Math.max(0, ((date.getTime() - opens.getTime()) / span) * 100));
  const progress = at(now);
  const marks = [
    { label: "Clock-in opens", time: opens, pos: 0 },
    { label: "Set off", time: start, pos: at(start) },
    { label: "Finish", time: end, pos: 100 },
  ];
  return (
    <section aria-label="The walk's day" className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
      <div className="relative h-1.5 rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
      </div>
      <ol className="grid grid-cols-3 gap-2 text-sm" suppressHydrationWarning>
        {marks.map((mark) => (
          <li className={cn("flex flex-col", mark.pos === 100 && "items-end text-right", mark.pos > 0 && mark.pos < 100 && "items-center text-center")} key={mark.label}>
            <strong>{formatTime(mark.time)}</strong>
            <span className="text-muted-foreground">{mark.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** 21: a ring filling from clock-in opening to the finish, the time left in its middle. */
function CountdownRing({ timing }: { timing: WalkTiming }) {
  const now = useWalkClock(timing);
  const start = new Date(timing.startsAt);
  const opens = walkOpensAt(start);
  const end = effectiveEndsAt({ durationMins: timing.durationMins, endedAt: timing.endedAt ? new Date(timing.endedAt) : null, startsAt: start });
  const share = Math.min(1, Math.max(0, (now.getTime() - opens.getTime()) / (end.getTime() - opens.getTime())));
  const minsLeft = Math.max(0, Math.round((end.getTime() - now.getTime()) / 60_000));
  const minsToStart = Math.max(0, Math.round((start.getTime() - now.getTime()) / 60_000));
  const [big, small] =
    now >= end ? ["Done", "finished"] : now < start ? [minsToStart > 120 ? `${Math.round(minsToStart / 60)}h` : `${minsToStart}`, minsToStart > 120 ? "to start" : "min to start"] : [`${minsLeft}`, "min left"];
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-36 shrink-0 self-center">
      <svg aria-hidden className="size-full -rotate-90" viewBox="0 0 120 120">
        <circle className="stroke-muted" cx="60" cy="60" fill="none" r={r} strokeWidth="10" />
        <circle
          className="stroke-emerald-600"
          cx="60"
          cy="60"
          fill="none"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - share)}
          strokeLinecap="round"
          strokeWidth="10"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" suppressHydrationWarning>
        <span className="text-3xl font-bold">{big}</span>
        <span className="text-xs text-muted-foreground">{small}</span>
      </div>
    </div>
  );
}

/** 5: time left (or until it starts), clocked in, distance, climb. */
function BigNumbers({
  attended,
  headline,
  timing,
}: {
  attended: number | null;
  headline: WalkIdeaParts["headline"];
  timing: WalkTiming;
}) {
  const now = useWalkClock(timing);
  const start = new Date(timing.startsAt);
  const end = effectiveEndsAt({ durationMins: timing.durationMins, endedAt: timing.endedAt ? new Date(timing.endedAt) : null, startsAt: start });
  const minsLeft = Math.max(0, Math.round((end.getTime() - now.getTime()) / 60_000));
  const minsToStart = Math.max(0, Math.round((start.getTime() - now.getTime()) / 60_000));
  const first =
    now < start
      ? { label: "Starts in", value: minsToStart > 120 ? `${Math.round(minsToStart / 60)}` : `${minsToStart}`, unit: minsToStart > 120 ? "h" : "min" }
      : now < end
        ? { label: "Time left", value: `${minsLeft}`, unit: "min" }
        : { label: "Length", value: `${timing.durationMins}`, unit: "min" };
  const stats = [
    first,
    ...(attended !== null ? [{ label: "Clocked in", value: String(attended), unit: "" }] : []),
    ...(headline.distance ? [{ label: "Distance", value: headline.distance, unit: "" }] : []),
    ...(headline.elevationGain ? [{ label: "Climb", value: headline.elevationGain, unit: "" }] : []),
  ];
  return (
    <dl className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
      {stats.map((stat, i) => (
        <div className={cn("flex min-w-0 flex-col gap-1 pr-4", i > 0 && "sm:border-l sm:pl-5")} key={stat.label}>
          <dt className="text-sm text-muted-foreground">{stat.label}</dt>
          <dd className="truncate text-4xl leading-none font-bold sm:text-5xl" suppressHydrationWarning>
            {stat.value}
            {stat.unit ? <span className="text-lg font-semibold"> {stat.unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** 9: Before, During and After, each opening the matching tab; the current one stands out. */
function Phases({
  attended,
  journey,
  onOpen,
  timing,
}: {
  attended: boolean;
  journey: boolean;
  onOpen: (tab: string) => void;
  timing: WalkTiming;
}) {
  const now = useWalkClock(timing);
  const status = walkStatus({
    cancelledAt: timing.cancelledAt ? new Date(timing.cancelledAt) : null,
    durationMins: timing.durationMins,
    endedAt: timing.endedAt ? new Date(timing.endedAt) : null,
    startsAt: new Date(timing.startsAt),
  }, now);
  const current = status === "completed" ? "after" : status === "in-progress" ? "during" : "before";
  const phases = [
    { id: "before", title: "Before", items: [["Map and directions", "route"], ["7-day forecast", "route"], ["Walk details", "overview"]] },
    { id: "during", title: "During", items: [["Clock in", "overview"], ...(attended ? [["Who's on the walk", "attended"]] : []), ...(journey ? [["Journey", "journey"]] : [])] },
    { id: "after", title: "After", items: [...(attended ? [["Who attended", "attended"]] : []), ...(journey ? [["Journey", "journey"]] : []), ["Walk details", "overview"]] },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {phases.map((phase) => (
        <section
          className={cn(
            "flex flex-col gap-2 rounded-xl border p-4",
            phase.id === current ? "border-2 border-emerald-700 bg-emerald-50 dark:bg-emerald-950" : "opacity-70",
          )}
          key={phase.id}
        >
          <h2 className="text-xs font-semibold tracking-wider uppercase" suppressHydrationWarning>
            {phase.title}
            {phase.id === current ? " · now" : ""}
          </h2>
          {phase.items.map(([label, target]) => (
            <button className="flex items-center justify-between text-left text-sm hover:underline" key={label} onClick={() => onOpen(target)} type="button">
              {label}
              <ChevronRight aria-hidden className="size-3.5" />
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}

/** 17: the walk's four stages as a bar, filled up to now. */
function Stepper({ timing }: { timing: WalkTiming }) {
  const now = useWalkClock(timing);
  const status = walkStatus({
    cancelledAt: timing.cancelledAt ? new Date(timing.cancelledAt) : null,
    durationMins: timing.durationMins,
    endedAt: timing.endedAt ? new Date(timing.endedAt) : null,
    startsAt: new Date(timing.startsAt),
  }, now);
  const order = ["upcoming", "starting-soon", "in-progress", "completed"];
  const reached = status === "cancelled" ? -1 : order.indexOf(status);
  const steps = ["Upcoming", "Clock-in open", "In progress", "Finished"];
  return (
    <ol aria-label="Where the walk is up to" className="grid grid-cols-4 gap-2">
      {steps.map((step, i) => (
        <li className="flex flex-col gap-1.5" key={step}>
          <span className={cn("h-1.5 rounded-full", i <= reached ? "bg-emerald-600" : "bg-muted")} />
          <span
            className={cn("text-xs sm:text-sm", i === reached ? "font-semibold" : i < reached ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}
            suppressHydrationWarning
          >
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** 19: one summary box that jumps to its part of the page. */
function BentoTile({ href, label, sub, value, wide = false }: { href: string; label: string; sub?: string; value: string; wide?: boolean }) {
  return (
    <a className={cn("flex min-w-0 flex-col gap-1 rounded-2xl border p-4 transition-colors hover:bg-accent", wide && "sm:col-span-2")} href={href}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-2xl font-semibold">{value}</span>
      {sub ? <span className="truncate text-xs text-muted-foreground">{sub}</span> : null}
    </a>
  );
}

