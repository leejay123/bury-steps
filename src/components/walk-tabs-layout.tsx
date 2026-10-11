"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { formatTime, formatWalkDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { effectiveEndsAt, walkOpensAt, walkStatus } from "@/lib/walk-window";
import type { WalkTabsVariant } from "@/lib/walk-page-sections";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalkHeadline } from "@/components/walk-headline";

type WalkTiming = {
  cancelledAt: string | null;
  durationMins: number;
  endedAt: string | null;
  startsAt: string;
};

/**
 * The one-column walk page layouts with tabs (Settings → Site wording →
 * Walk page cards → Layout), the same for members and organisers. Each page
 * hands over its parts; this arranges them:
 *
 * - A, "strip": title, then a row of actions (clock-in, share, the walk's
 *   buttons), then the tabs.
 * - B, "sticky": title and details, then a tab bar that stays at the top of
 *   the screen as you scroll, with Share and Clock in at its end.
 * - C, "status": a coloured box saying what's happening now, with the main
 *   actions, then the title and the tabs.
 * - D, "tiles": title with a Manage walk menu, and an Overview of summary
 *   boxes that each open their tab.
 *
 * Tabs: Overview, Map & weather, Attended (organisers), Journey (when there
 * is one). They follow Settings → Site behaviour → Tabs like every tab bar.
 */
export function WalkTabsLayout({
  attended,
  details,
  headline,
  journey,
  live,
  liveCompact,
  meeting,
  notices,
  sections,
  share,
  timing,
  tools,
  variant,
  what3words,
}: {
  /** Organisers' Attended tab: its label (with the count, where allowed) and list. */
  attended: { label: string; count: number | null; content: ReactNode } | null;
  /** The walk's facts and description (Overview). */
  details: ReactNode;
  /** The title line (WalkHeadline); D adds its Manage walk button to it. */
  headline: Omit<ComponentProps<typeof WalkHeadline>, "action">;
  journey: { count: number; content: ReactNode } | null;
  /** Clock-in: the organiser's panel, or the member's live part. */
  live: ReactNode;
  /** Just the Clock in button, for B's bar and C's box (organisers). */
  liveCompact?: ReactNode;
  meeting: string | null;
  notices: ReactNode;
  /** Map, forecast and precise location (Map & weather). */
  sections: ReactNode;
  /** Copy share link (organisers). */
  share?: ReactNode;
  timing: WalkTiming;
  /** The walk's buttons (organisers). */
  tools?: ReactNode;
  variant: WalkTabsVariant;
  what3words: string | null;
}) {
  const [tab, setTab] = useState("overview");
  const [manageOpen, setManageOpen] = useState(false);
  const headerHeight = useSiteHeaderHeight(variant === "sticky");

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "route", label: "Map & weather" },
    ...(attended ? [{ value: "attended", label: attended.label }] : []),
    ...(journey ? [{ value: "journey", label: "Journey" }] : []),
  ];
  const list = (
    <TabsList className={variant === "sticky" ? "min-w-0 flex-1" : undefined}>
      {tabs.map((t) => (
        <TabsTrigger key={t.value} value={t.value}>
          {t.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );

  const overview = (
    <>
      {variant === "tiles" ? (
        <SummaryTiles
          attendedCount={attended?.count ?? null}
          journeyCount={journey?.count ?? null}
          meeting={meeting}
          onOpen={setTab}
          what3words={what3words}
        />
      ) : null}
      {variant === "tiles" || variant === "sticky" || variant === "status" ? live : null}
      {details}
    </>
  );

  const manage =
    variant === "tiles" && (share || tools) ? (
      <Button
        aria-expanded={manageOpen}
        onClick={() => setManageOpen((open) => !open)}
        type="button"
        variant="outline"
      >
        Manage walk
        <ChevronDown className={cn("transition-transform", manageOpen && "rotate-180")} data-icon="inline-end" />
      </Button>
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      {variant === "status" ? (
        <StatusBox timing={timing} clockedIn={attended?.count ?? null}>
          {share}
          {liveCompact}
        </StatusBox>
      ) : null}

      {notices}
      <WalkHeadline {...headline} action={manage} />

      {variant === "tiles" && manageOpen ? (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          {share}
          {tools}
        </div>
      ) : null}

      {variant === "strip" ? (
        <div className="flex flex-col gap-3">
          {live}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
            {share}
            {tools}
          </div>
        </div>
      ) : null}

      {variant === "status" && tools ? tools : null}

      <Tabs onValueChange={setTab} value={tab}>
        {variant === "sticky" ? (
          <>
            {/* Stays under the site's menu as you scroll (position: sticky,
                offset by the menu's own height, measured). No box around it:
                just the page's background, so the tabs read as tabs. */}
            <div
              className="sticky z-20 flex flex-col gap-2 bg-background py-2 sm:flex-row sm:items-center sm:justify-between"
              style={{ top: headerHeight }}
            >
              {list}
              {share || liveCompact ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center">
                  {share}
                  {liveCompact}
                </div>
              ) : null}
            </div>
            {tools ? <div className="mt-2">{tools}</div> : null}
          </>
        ) : (
          list
        )}
        {[
          { value: "overview", content: overview },
          { value: "route", content: sections },
          ...(attended ? [{ value: "attended", content: attended.content }] : []),
          ...(journey ? [{ value: "journey", content: journey.content }] : []),
        ].map((panel) => (
          <TabsContent className="mt-4 flex flex-col gap-6" key={panel.value} value={panel.value}>
            {panel.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/** The site menu's height, so B's bar sits just under it (the announcement bar can make it taller). */
function useSiteHeaderHeight(enabled: boolean): number {
  const [height, setHeight] = useState(64);
  useEffect(() => {
    if (!enabled) return;
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;
    const update = () => setHeight(header.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, [enabled]);
  return height;
}

/** C: what's happening now, in words, with the main actions beside it. Ticks with the walk clock. */
function StatusBox({
  children,
  clockedIn,
  timing,
}: {
  children: ReactNode;
  clockedIn: number | null;
  timing: WalkTiming;
}) {
  const now = useWalkClock(timing);
  const walk = {
    cancelledAt: timing.cancelledAt ? new Date(timing.cancelledAt) : null,
    durationMins: timing.durationMins,
    endedAt: timing.endedAt ? new Date(timing.endedAt) : null,
    startsAt: new Date(timing.startsAt),
  };
  const status = walkStatus(walk, now);
  const opensAt = walkOpensAt(walk.startsAt);
  const count = clockedIn === null ? "" : ` · ${clockedIn} clocked in`;
  const { eyebrow, line, tone } =
    status === "cancelled"
      ? { eyebrow: "Cancelled", line: "This walk isn't going ahead", tone: "bg-destructive/10 text-destructive" }
      : status === "upcoming"
        ? {
            eyebrow: "Upcoming",
            line: `Clock-in opens at ${formatTime(opensAt)} on ${formatWalkDay(opensAt, now)}`,
            tone: "bg-muted text-foreground",
          }
        : status === "starting-soon"
          ? {
              eyebrow: "Clock-in open",
              line: `Starts at ${formatTime(walk.startsAt)}${count}`,
              tone: "bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50",
            }
          : status === "in-progress"
            ? {
                eyebrow: "In progress",
                line: `Finishes at ${formatTime(effectiveEndsAt(walk))}${count}`,
                tone: "bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50",
              }
            : {
                eyebrow: "Finished",
                line: clockedIn === null ? "This walk has finished" : `${clockedIn} attended`,
                tone: "bg-muted text-foreground",
              };
  return (
    <section
      aria-label="What's happening now"
      className={cn("flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5", tone)}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold tracking-wider uppercase">{eyebrow}</span>
        <span className="text-lg font-semibold" suppressHydrationWarning>
          {line}
        </span>
      </div>
      <div className="flex flex-col gap-2 empty:hidden sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
    </section>
  );
}

/** D: summary boxes on the Overview tab, each opening its own tab. */
function SummaryTiles({
  attendedCount,
  journeyCount,
  meeting,
  onOpen,
  what3words,
}: {
  attendedCount: number | null;
  journeyCount: number | null;
  meeting: string | null;
  onOpen: (tab: string) => void;
  what3words: string | null;
}) {
  const tiles = [
    ...(attendedCount !== null
      ? [{ tab: "attended", label: "Attended", value: String(attendedCount), hint: "See who" }]
      : []),
    ...(meeting
      ? [
          {
            tab: "route",
            label: "Meeting point",
            value: meeting,
            hint: what3words ? `///${what3words} · Map and directions` : "Map and directions",
          },
        ]
      : []),
    { tab: "route", label: "Weather", value: "Forecast for the day", hint: "7-day forecast" },
    ...(journeyCount !== null
      ? [
          {
            tab: "journey",
            label: "Journey",
            value: journeyCount === 0 ? "No moments yet" : `${journeyCount} ${journeyCount === 1 ? "moment" : "moments"}`,
            hint: "Open the journey",
          },
        ]
      : []),
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tiles.map((tile) => (
        <button
          className="flex min-w-0 flex-col gap-1 rounded-xl border p-4 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          key={tile.label}
          onClick={() => onOpen(tile.tab)}
          type="button"
        >
          <span className="text-xs text-muted-foreground">{tile.label}</span>
          <span className="truncate text-xl font-semibold">{tile.value}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {tile.hint}
            <ChevronRight aria-hidden className="size-3.5" />
          </span>
        </button>
      ))}
    </div>
  );
}
