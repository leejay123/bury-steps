"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock,
  CloudSun,
  Flag,
  Footprints,
  MapPin,
  Mountain,
  Navigation,
  PanelLeft,
  Timer,
  TrendingUp,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { effectiveEndsAt, walkOpensAt, walkStatus } from "@/lib/walk-window";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { Button } from "@/components/ui/button";
import { ShareLinkButton } from "@/components/share-link";
import { WalkDescription } from "@/components/walk-description";
import { WalkEssentialPills } from "@/components/walk-essentials-context";
import { useWalkNow } from "@/components/walk-header-styles";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import { WalkActionsBar, WalkManageMenu } from "@/components/walk-manage-menu";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import {
  DirectionsButtons,
  MapLookProvider,
  type MapLook,
} from "@/components/walk-map";
import { useWalkParts } from "./parts";

/**
 * The blocks of the walk page designer (Settings → Walk page designer):
 * every piece of the walk page designs, each with the looks those designs
 * had as variants to choose from. They read the walk from WalkPartsProvider;
 * in the designer, with no walk, they show a short label instead.
 */

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
type Fact = { icon: Icon; label: string; value: string; wide?: boolean };

/** The walk's times, facts and live status, worked out once for the blocks. */
function useWalkInfo(p: WalkIdeaParts) {
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
  const status = walkStatus(
    {
      cancelledAt: p.timing.cancelledAt ? new Date(p.timing.cancelledAt) : null,
      durationMins: p.timing.durationMins,
      endedAt: p.timing.endedAt ? new Date(p.timing.endedAt) : null,
      startsAt: start,
    },
    clock,
  );
  const organiser = Boolean(p.tools);
  const facts: Fact[] = [
    { icon: CalendarDays, label: "Date", value: formatWalkDay(start) },
    { icon: Clock, label: "Starts", value: formatTime(start) },
    { icon: Flag, label: "Finishes", value: formatTime(end) },
    { icon: Timer, label: "Length", value: formatWalkLength(h.durationMins) },
    ...[
      { icon: MapPin, label: "Meeting point", value: p.meeting, wide: true },
      {
        icon: Navigation,
        label: "what3words",
        value: p.what3words ? `///${p.what3words}` : null,
      },
      { icon: Footprints, label: "Distance", value: h.distance },
      { icon: Mountain, label: "Climb", value: h.elevationGain },
      { icon: TrendingUp, label: "Grade", value: h.grade },
      { icon: UserRound, label: "Walk leader", value: h.walkLeader },
      { icon: UsersRound, label: "Back marker", value: p.walk.backMarker },
    ].flatMap((fact) =>
      fact.value
        ? [{ ...fact, value: fact.value }]
        : organiser
          ? [{ ...fact, value: "Not set" }]
          : [],
    ),
  ];
  const minsLeft = Math.max(
    0,
    Math.round((end.getTime() - clock.getTime()) / 60_000),
  );
  const minsToStart = Math.max(
    0,
    Math.round((start.getTime() - clock.getTime()) / 60_000),
  );
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
  const progress = Math.min(
    100,
    Math.max(
      0,
      ((clock.getTime() - opens.getTime()) /
        (end.getTime() - opens.getTime())) *
        100,
    ),
  );
  return {
    clock,
    now,
    start,
    end,
    opens,
    status,
    organiser,
    facts,
    countdown,
    progress,
  };
}

/** In the designer with no walk to show: a labelled outline of the block's place. */
function Placeholder({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function withParts(label: string, render: (p: WalkIdeaParts) => ReactNode) {
  return function Block() {
    const p = useWalkParts();
    return p ? <>{render(p)}</> : <Placeholder label={label} />;
  };
}

// ── Small shared pieces ─────────────────────────────────────────────────
function Badge({ p, className }: { p: WalkIdeaParts; className?: string }) {
  const h = p.headline;
  return (
    <WalkStatusBadge
      cancelledAt={h.cancelledAt}
      className={cn("shrink-0", className)}
      durationMins={h.durationMins}
      endedAt={h.endedAt}
      startsAt={h.startsAt}
    />
  );
}

function StatusLine({
  p,
  className,
}: {
  p: WalkIdeaParts;
  className?: string;
}) {
  const { now } = useWalkInfo(p);
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
      suppressHydrationWarning
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          now.live ? "bg-emerald-500" : "bg-muted-foreground/40",
        )}
      />
      {now.eyebrow} · {now.line}
    </span>
  );
}

/** Clock in (while it can be used) and one Manage list; members get Share or save. */
export function Actions({
  p,
  className,
}: {
  p: WalkIdeaParts;
  className?: string;
}) {
  if (p.share || p.tools)
    return (
      <WalkActionsBar
        className={className}
        liveCompact={p.liveCompact}
        share={p.share}
        tools={p.tools}
      />
    );
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center",
        className,
      )}
    >
      <WalkManageMenu label="Share or save">
        <ShareLinkButton url={p.walk.shareUrl} />
        <Button asChild size="sm" variant="outline">
          <a download href={p.walk.calendarHref}>
            <CalendarPlus data-icon="inline-start" />
            Add to calendar
          </a>
        </Button>
      </WalkManageMenu>
    </div>
  );
}

function Essentials({ p, dark = false }: { p: WalkIdeaParts; dark?: boolean }) {
  if (p.tools && p.walk.essentials.length === 0)
    return (
      <p
        className={cn(
          "text-xs",
          dark ? "text-white/60" : "text-muted-foreground",
        )}
      >
        <span className="font-medium tracking-wide uppercase">Essentials</span>{" "}
        · None ticked
      </p>
    );
  return <WalkEssentialPills keys={p.walk.essentials} />;
}

/** Fill the width (onto more rows as needed), or keep to one row that swipes sideways. */
export type Arrange = "fill" | "scroll";
const SWIPE =
  "flex flex-nowrap snap-x overflow-x-auto pb-1 [scrollbar-width:none] [&>*]:shrink-0 [&>*]:snap-start";

export type FactsVariant =
  "grid" | "list" | "table" | "inline" | "chips" | "tiles";

function Facts({
  p,
  variant,
  dark = false,
  arrange = "fill",
}: {
  p: WalkIdeaParts;
  variant: FactsVariant;
  dark?: boolean;
  arrange?: Arrange;
}) {
  const swipe = arrange === "scroll";
  const { facts } = useWalkInfo(p);
  const muted = dark ? "text-white/60" : "text-muted-foreground";
  if (variant === "inline")
    return (
      <p
        className={cn(
          "flex flex-wrap gap-x-4 gap-y-1.5 text-sm",
          dark && "text-white/90",
          swipe && cn(SWIPE, "whitespace-nowrap"),
        )}
        suppressHydrationWarning
      >
        {facts.map((fact) => (
          <span className="flex items-center gap-1.5" key={fact.label}>
            <fact.icon aria-hidden className={cn("size-4", muted)} />
            {fact.value}
          </span>
        ))}
      </p>
    );
  if (variant === "chips")
    return (
      <ul
        className={cn(
          "flex flex-wrap gap-1.5",
          swipe && cn(SWIPE, "whitespace-nowrap"),
        )}
      >
        {facts.map((fact) => (
          <li
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:text-sm",
              dark ? "bg-white/10" : "bg-muted",
            )}
            key={fact.label}
          >
            <fact.icon aria-hidden className="size-3.5 opacity-70" />
            <span suppressHydrationWarning>{fact.value}</span>
          </li>
        ))}
      </ul>
    );
  if (variant === "tiles")
    return (
      <dl
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-4",
          swipe && cn(SWIPE, "[&>*]:w-40"),
        )}
      >
        {facts.map((fact) => (
          <div
            className={cn(
              "flex min-w-0 flex-col gap-1 rounded-xl p-3",
              dark ? "bg-white/10" : "bg-muted/60",
            )}
            key={fact.label}
          >
            <dt className={cn("flex items-center gap-1.5 text-xs", muted)}>
              <fact.icon aria-hidden className="size-3.5" />
              {fact.label}
            </dt>
            <dd
              className="truncate text-sm font-semibold"
              suppressHydrationWarning
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  if (variant === "list" || variant === "table")
    return (
      <dl
        className={cn(
          "grid text-sm sm:grid-cols-2 sm:gap-x-8",
          variant === "table" && "sm:grid-cols-1",
        )}
      >
        {facts.map((fact) => (
          <div
            className={cn(
              "flex items-baseline justify-between gap-4 border-b py-2",
              dark && "border-white/15",
            )}
            key={fact.label}
          >
            <dt className={cn("flex shrink-0 items-center gap-2", muted)}>
              <fact.icon aria-hidden className="size-4" />
              {fact.label}
            </dt>
            <dd
              className="min-w-0 text-right font-medium break-words"
              suppressHydrationWarning
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4",
        swipe && cn(SWIPE, "[&>*]:w-36"),
      )}
    >
      {facts.map((fact) => (
        <div
          className={cn(
            "flex min-w-0 flex-col gap-0.5",
            fact.wide && "col-span-2",
          )}
          key={fact.label}
        >
          <dt className={cn("flex items-center gap-1.5 text-xs", muted)}>
            <fact.icon aria-hidden className="size-3.5" />
            {fact.label}
          </dt>
          <dd
            className="text-sm font-semibold break-words"
            suppressHydrationWarning
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Timeline({ p }: { p: WalkIdeaParts }) {
  const { opens, start, end, progress } = useWalkInfo(p);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-emerald-600"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className="flex justify-between text-xs text-muted-foreground"
        suppressHydrationWarning
      >
        <span>{formatTime(opens)} clock-in opens</span>
        <span>{formatTime(start)} set off</span>
        <span>{formatTime(end)} finish</span>
      </div>
    </div>
  );
}

function FlushMap({ p, className }: { p: WalkIdeaParts; className?: string }) {
  if (!p.map) return null;
  return (
    <div
      className={cn(
        "[&_[data-slot=card]]:gap-3 [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:py-0 [&_[data-slot=card]]:pb-4 [&_[data-slot=card]]:shadow-none",
        className,
      )}
    >
      {p.map}
    </div>
  );
}

// ── Walk blocks ─────────────────────────────────────────────────────────
export const MessagesBlock = withParts(
  "Messages (only when there are any)",
  (p) => <>{p.notices}</>,
);

export const ClockInBlock = withParts(
  "Clock-in (members: clock in and who's on the walk)",
  (p) => <>{p.live}</>,
);

export type TitleVariant =
  | "plain"
  | "chips"
  | "stats"
  | "band"
  | "magazine"
  | "poster"
  | "trailhead"
  | "dark"
  | "calendar"
  | "split"
  | "contours"
  | "typographic";

export function TitleBlock({
  variant = "plain",
  actions = true,
}: {
  variant?: TitleVariant;
  actions?: boolean;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Title · ${variant}`} />;
  return <Title actions={actions} p={p} variant={variant} />;
}

function Title({
  p,
  variant,
  actions,
}: {
  p: WalkIdeaParts;
  variant: TitleVariant;
  actions: boolean;
}) {
  const info = useWalkInfo(p);
  const h = p.headline;
  const note = h.note ? (
    <p className="text-xs text-muted-foreground">{h.note}</p>
  ) : null;
  const act = actions ? <Actions className="sm:shrink-0" p={p} /> : null;
  const heading = (className?: string) => (
    <h1
      className={cn(
        "text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl",
        className,
      )}
    >
      {h.title}
    </h1>
  );
  const day = formatWalkDay(info.start);
  const time = formatTime(info.start);
  switch (variant) {
    case "chips":
      return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {heading()}
              <Badge p={p} />
            </div>
            <Facts p={p} variant="chips" />
            {note}
          </div>
          {act}
        </div>
      );
    case "stats":
      return (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <StatusLine p={p} />
              {heading("sm:text-4xl")}
              {note}
            </div>
            {act}
          </div>
          <dl className="grid grid-cols-2 border-y sm:grid-cols-4">
            {[
              { label: "Starts", value: time, sub: day },
              {
                label: "Length",
                value: formatWalkLength(h.durationMins),
                sub: h.distance,
              },
              { label: "Grade", value: h.grade ?? "—", sub: h.elevationGain },
              {
                label: "Meet at",
                value: p.meeting ?? "—",
                sub: p.what3words ? `///${p.what3words}` : null,
              },
            ].map((stat, i) => (
              <div
                className={cn(
                  "flex min-w-0 flex-col gap-0.5 py-3 sm:px-4 sm:first:pl-0",
                  i > 0 && "sm:border-l",
                  i % 2 === 1 && "max-sm:border-l max-sm:pl-4",
                  i > 1 && "max-sm:border-t",
                )}
                key={stat.label}
              >
                <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                <dd
                  className="truncate text-lg font-semibold"
                  suppressHydrationWarning
                >
                  {stat.value}
                </dd>
                {stat.sub ? (
                  <dd className="truncate text-xs text-muted-foreground">
                    {stat.sub}
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        </div>
      );
    case "band":
      return (
        <section className="overflow-hidden rounded-xl border">
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-sm font-medium sm:px-5",
              info.now.tone,
            )}
            suppressHydrationWarning
          >
            <span>
              {info.now.eyebrow} · {info.now.line}
            </span>
            <span className="font-normal">
              {day}, {time} to {formatTime(info.end)}
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="flex min-w-0 flex-col gap-1.5">
              {heading()}
              {note}
            </div>
            {act}
          </div>
        </section>
      );
    case "magazine":
      return (
        <div className="flex flex-col gap-4">
          <span
            className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase"
            suppressHydrationWarning
          >
            {day} walk
          </span>
          <h1 className="font-serif text-4xl leading-[1.05] font-semibold sm:text-5xl">
            {h.title}
          </h1>
          <div
            className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y py-3 text-sm"
            suppressHydrationWarning
          >
            <span>
              <strong>{time}</strong> start
            </span>
            <span>
              <strong>{formatWalkLength(h.durationMins)}</strong>
            </span>
            {p.meeting ? (
              <span>
                <strong>{p.meeting}</strong> meet
              </span>
            ) : null}
            <span className="sm:ml-auto">
              <StatusLine p={p} />
            </span>
          </div>
          {act}
        </div>
      );
    case "poster":
      return (
        <div className="flex flex-col gap-4">
          <section className="flex min-h-64 flex-col justify-end gap-3 rounded-3xl bg-orange-500 p-6 text-orange-950 sm:p-10">
            <span
              className="text-sm font-bold tracking-widest uppercase"
              suppressHydrationWarning
            >
              {day} · {time}
            </span>
            <h1 className="text-4xl leading-[0.95] font-black tracking-tight uppercase sm:text-6xl">
              {h.title}
            </h1>
            <span className="text-sm font-semibold">
              {[p.meeting, h.distance, h.grade].filter(Boolean).join(" · ")}
            </span>
          </section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <StatusLine p={p} />
            {act}
          </div>
        </div>
      );
    case "trailhead":
      return (
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-5 rounded-2xl border-4 border-emerald-950 bg-emerald-900 p-6 text-emerald-50 sm:p-8">
            <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-80">
              Bury Steps · Trail
            </span>
            <h1 className="text-3xl leading-tight font-semibold uppercase sm:text-5xl">
              {h.title}
            </h1>
            <div
              className="grid grid-cols-2 gap-4 border-t border-emerald-50/20 pt-5 sm:grid-cols-4"
              suppressHydrationWarning
            >
              {[
                ["Distance", h.distance ?? "—"],
                ["Climb", h.elevationGain ?? "—"],
                ["Time", formatWalkLength(h.durationMins)],
                ["Grade", h.grade ?? "—"],
              ].map(([label, value]) => (
                <div className="flex flex-col" key={label}>
                  <span className="text-[11px] font-bold tracking-widest uppercase opacity-70">
                    {label}
                  </span>
                  <span className="text-xl font-bold">{value}</span>
                </div>
              ))}
            </div>
            <span className="text-sm opacity-90" suppressHydrationWarning>
              {day} · sets off {time}
              {p.meeting ? ` from ${p.meeting}` : ""}
            </span>
          </section>
          {act}
        </div>
      );
    case "dark":
      return (
        <section className="flex flex-col gap-4 rounded-2xl bg-neutral-950 p-5 text-neutral-50 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <Badge p={p} />
              {heading()}
              <Facts dark p={p} variant="inline" />
              {h.note ? (
                <p className="text-xs text-white/60">{h.note}</p>
              ) : null}
            </div>
            {act}
          </div>
        </section>
      );
    case "calendar":
      return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            aria-hidden
            className="w-20 shrink-0 overflow-hidden rounded-xl border text-center shadow-sm"
          >
            <div
              className="bg-destructive py-0.5 text-xs font-semibold text-white uppercase"
              suppressHydrationWarning
            >
              {info.start.toLocaleString("en-GB", {
                month: "short",
                timeZone: "Europe/London",
              })}
            </div>
            <div className="py-1 text-3xl font-bold" suppressHydrationWarning>
              {info.start.toLocaleString("en-GB", {
                day: "numeric",
                timeZone: "Europe/London",
              })}
            </div>
            <div
              className="pb-1.5 text-[11px] text-muted-foreground"
              suppressHydrationWarning
            >
              {info.start.toLocaleString("en-GB", {
                weekday: "short",
                timeZone: "Europe/London",
              })}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {heading()}
            <span
              className="text-sm text-muted-foreground"
              suppressHydrationWarning
            >
              {time} to {formatTime(info.end)}
              {p.meeting ? ` · ${p.meeting}` : ""}
            </span>
            <StatusLine p={p} />
          </div>
          {act}
        </div>
      );
    case "split":
      return (
        <section className="grid overflow-hidden rounded-xl border sm:grid-cols-[12rem_minmax(0,1fr)]">
          <div
            className={cn(
              "flex flex-col justify-center gap-1 p-5",
              info.now.tone,
            )}
            suppressHydrationWarning
          >
            <span className="text-xs font-semibold tracking-wider uppercase">
              {info.now.eyebrow}
            </span>
            <span className="text-4xl leading-none font-bold">{time}</span>
            <span className="text-sm">{day}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-3 p-5">
            {heading()}
            {note}
            {act}
          </div>
        </section>
      );
    case "contours":
      return (
        <section className="relative overflow-hidden rounded-3xl border bg-stone-50 p-6 sm:p-8 dark:bg-stone-950">
          <svg
            aria-hidden
            className="absolute inset-0 size-full text-stone-300 dark:text-stone-700"
            preserveAspectRatio="none"
            viewBox="0 0 400 200"
          >
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
            <StatusLine p={p} />
            {heading("sm:text-4xl")}
            {note}
            {act}
          </div>
        </section>
      );
    case "typographic":
      return (
        <div className="flex flex-col gap-2 border-b pb-6">
          <span
            className="text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            {day}
          </span>
          <span
            className="text-7xl leading-none font-bold tracking-tighter sm:text-8xl"
            suppressHydrationWarning
          >
            {time}
          </span>
          {heading("mt-3 text-xl font-medium sm:text-2xl")}
          <StatusLine p={p} />
          {act ? <div className="mt-2">{act}</div> : null}
        </div>
      );
    default:
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge p={p} />
              <StatusLine p={p} />
            </div>
            {heading()}
            {note}
          </div>
          {act}
        </div>
      );
  }
}

export type DetailsOptions = {
  facts?: FactsVariant;
  factsArrange?: Arrange;
  map?: "none" | "top" | "side" | "bottom";
  mapButtons?: "below" | "above" | "none";
  mapHeight?: "short" | "medium" | "tall";
  tone?: "card" | "tint" | "dark" | "plain";
  ribbon?: boolean;
  timeline?: boolean;
  bigTitle?: boolean;
  showTitle?: boolean;
  showActions?: boolean;
  showEssentials?: boolean;
  showDescription?: boolean;
};

/** The one Details card: everything from Edit walk, with no boxes inside it. */
export function DetailsBlock(options: DetailsOptions) {
  const p = useWalkParts();
  if (!p)
    return <Placeholder label="Details card (everything about the walk)" />;
  return <Details o={options} p={p} />;
}

function Details({ p, o }: { p: WalkIdeaParts; o: DetailsOptions }) {
  const info = useWalkInfo(p);
  const dark = o.tone === "dark";
  const showTitle = o.showTitle ?? true;
  const map = o.map ?? "none";
  const body = (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-5 p-5 sm:p-6",
        o.bigTitle && "sm:p-8",
      )}
    >
      {showTitle || (o.showActions ?? true) ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {showTitle ? (
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge p={p} />
                <StatusLine
                  className={dark ? "text-white/80" : undefined}
                  p={p}
                />
              </div>
              <h1
                className={cn(
                  "text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl",
                  o.bigTitle && "sm:text-4xl",
                )}
              >
                {p.headline.title}
              </h1>
              {p.headline.note ? (
                <p
                  className={cn(
                    "text-xs",
                    dark ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  {p.headline.note}
                </p>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          {(o.showActions ?? true) ? (
            <Actions className="sm:shrink-0" p={p} />
          ) : null}
        </div>
      ) : null}
      {o.timeline ? <Timeline p={p} /> : null}
      <Facts
        arrange={o.factsArrange}
        dark={dark}
        p={p}
        variant={o.facts ?? "grid"}
      />
      {(o.showEssentials ?? true) ? <Essentials dark={dark} p={p} /> : null}
      {(o.showDescription ?? true) && p.walk.description ? (
        <WalkDescription description={p.walk.description} />
      ) : null}
    </div>
  );
  return (
    <MapLookProvider
      value={{
        buttons: o.mapButtons ?? "below",
        height: o.mapHeight ?? "medium",
      }}
    >
      <section
        aria-label="Walk details"
        className={cn(
          "overflow-hidden",
          o.tone === "plain"
            ? ""
            : "rounded-2xl border in-data-[bleed]:rounded-none in-data-[bleed]:border-x-0",
          dark && "border-neutral-800 bg-neutral-950 text-white",
          o.tone === "tint" && "bg-muted/40",
          (!o.tone || o.tone === "card") && "bg-card shadow-sm",
        )}
      >
        {o.ribbon ? (
          // A band across the top of the card saying where the walk is up to.
          <div
            className={cn(
              "flex items-center gap-2 px-5 py-2 text-sm sm:px-6",
              info.now.tone,
            )}
            suppressHydrationWarning
          >
            <span
              aria-hidden
              className={cn(
                "size-2 shrink-0 rounded-full",
                info.now.live ? "bg-emerald-500" : "bg-current opacity-40",
              )}
            />
            <span className="font-semibold">{info.now.eyebrow}</span>
            <span className="truncate opacity-80">{info.now.line}</span>
          </div>
        ) : null}
        {map === "top" ? <FlushMap className="border-b" p={p} /> : null}
        {map === "side" && p.map ? (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_24rem]">
            {body}
            <FlushMap className="border-t lg:border-t-0 lg:border-l" p={p} />
          </div>
        ) : (
          body
        )}
        {map === "bottom" ? <FlushMap className="border-t" p={p} /> : null}
      </section>
    </MapLookProvider>
  );
}

export function FactsBlock({
  variant = "grid",
  arrange = "fill",
}: {
  variant?: FactsVariant;
  arrange?: Arrange;
}) {
  const p = useWalkParts();
  return p ? (
    <Facts arrange={arrange} p={p} variant={variant} />
  ) : (
    <Placeholder label={`Facts · ${variant}`} />
  );
}

export const EssentialsBlock = withParts("Essentials", (p) => (
  <Essentials p={p} />
));
export const DescriptionBlock = withParts("Description", (p) =>
  p.walk.description ? (
    <WalkDescription description={p.walk.description} />
  ) : null,
);

export type ActionsShow = "both" | "manage" | "clock";

/**
 * Clock in and Manage together, or either one alone. Clock in only shows
 * while it can be used — switch the designer's preview to Clock-in open to
 * see it. Members' clocking in is in the Clock-in panel instead.
 */
export function ActionsBlock({
  align = "start",
  show = "both",
}: {
  align?: "start" | "end" | "full";
  show?: ActionsShow;
}) {
  const p = useWalkParts();
  const label =
    show === "clock"
      ? "Clock in button (while clock-in is open)"
      : show === "manage"
        ? "Manage button"
        : "Clock in + Manage";
  if (!p) return <Placeholder label={label} />;
  return (
    <div
      className={cn(
        "flex",
        align === "end" && "sm:justify-end",
        align === "full" && "[&>*]:w-full [&_button]:w-full",
      )}
    >
      {show === "clock" ? (
        p.liveCompact ? (
          <div>{p.liveCompact}</div>
        ) : null
      ) : (
        <Actions p={show === "manage" ? { ...p, liveCompact: null } : p} />
      )}
    </div>
  );
}

export type StatusVariant =
  | "line"
  | "box"
  | "band"
  | "takeover"
  | "stepper"
  | "timeline"
  | "ring"
  | "numbers"
  | "phases";

export function StatusBlock({ variant = "box" }: { variant?: StatusVariant }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Status · ${variant}`} />;
  return <Status p={p} variant={variant} />;
}

function Status({ p, variant }: { p: WalkIdeaParts; variant: StatusVariant }) {
  const info = useWalkInfo(p);
  const h = p.headline;
  switch (variant) {
    case "line":
      return <StatusLine p={p} />;
    case "band":
      return (
        <div
          aria-hidden
          className={cn(
            "h-2 rounded-full",
            info.now.live ? "bg-emerald-500" : "bg-muted-foreground/30",
          )}
        />
      );
    case "takeover":
      return (
        <section
          className={cn(
            "flex flex-col items-center gap-2 rounded-3xl px-6 py-10 text-center",
            info.now.tone,
          )}
        >
          <span
            className="text-sm font-bold tracking-widest uppercase"
            suppressHydrationWarning
          >
            {info.now.eyebrow}
          </span>
          <span
            className="text-7xl leading-none font-black tracking-tighter sm:text-8xl"
            suppressHydrationWarning
          >
            {info.countdown.value}
          </span>
          <span className="text-sm font-semibold" suppressHydrationWarning>
            {info.countdown.unit}
          </span>
        </section>
      );
    case "stepper": {
      const order = ["upcoming", "starting-soon", "in-progress", "completed"];
      const reached =
        info.status === "cancelled" ? -1 : order.indexOf(info.status);
      return (
        <ol
          aria-label="Where the walk is up to"
          className="grid grid-cols-4 gap-2"
        >
          {["Upcoming", "Clock-in open", "In progress", "Finished"].map(
            (step, i) => (
              <li className="flex flex-col gap-1.5" key={step}>
                <span
                  className={cn(
                    "h-1.5 rounded-full",
                    i <= reached ? "bg-emerald-600" : "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "text-xs sm:text-sm",
                    i === reached ? "font-semibold" : "text-muted-foreground",
                  )}
                  suppressHydrationWarning
                >
                  {step}
                </span>
              </li>
            ),
          )}
        </ol>
      );
    }
    case "timeline":
      return (
        <section className="rounded-xl border p-4 sm:p-5">
          <Timeline p={p} />
        </section>
      );
    case "ring": {
      const r = 52;
      const c = 2 * Math.PI * r;
      return (
        <div className="relative size-36 shrink-0">
          <svg
            aria-hidden
            className="size-full -rotate-90"
            viewBox="0 0 120 120"
          >
            <circle
              className="stroke-muted"
              cx="60"
              cy="60"
              fill="none"
              r={r}
              strokeWidth="10"
            />
            <circle
              className="stroke-emerald-600"
              cx="60"
              cy="60"
              fill="none"
              r={r}
              strokeDasharray={c}
              strokeDashoffset={c * (1 - info.progress / 100)}
              strokeLinecap="round"
              strokeWidth="10"
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            suppressHydrationWarning
          >
            <span className="text-3xl font-bold">{info.countdown.value}</span>
            <span className="text-xs text-muted-foreground">
              {info.countdown.unit}
            </span>
          </div>
        </div>
      );
    }
    case "numbers":
      return (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y py-5 sm:grid-cols-4">
          {[
            {
              label: info.status === "in-progress" ? "Time left" : "Countdown",
              value: info.countdown.value,
              unit: info.countdown.unit,
            },
            ...(p.attended?.count != null
              ? [
                  {
                    label: "Clocked in",
                    value: String(p.attended.count),
                    unit: "people",
                  },
                ]
              : []),
            ...(h.distance
              ? [{ label: "Distance", value: h.distance, unit: "" }]
              : []),
            ...(h.elevationGain
              ? [{ label: "Climb", value: h.elevationGain, unit: "" }]
              : []),
            ...(h.grade ? [{ label: "Grade", value: h.grade, unit: "" }] : []),
          ]
            .slice(0, 4)
            .map((stat) => (
              <div className="flex min-w-0 flex-col gap-1" key={stat.label}>
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {stat.label}
                </dt>
                <dd
                  className="truncate text-4xl leading-none font-bold tracking-tight sm:text-5xl"
                  suppressHydrationWarning
                >
                  {stat.value}
                </dd>
                {stat.unit ? (
                  <dd className="text-xs text-muted-foreground">{stat.unit}</dd>
                ) : null}
              </div>
            ))}
        </dl>
      );
    case "phases": {
      const current =
        info.status === "completed"
          ? "after"
          : info.status === "in-progress"
            ? "during"
            : "before";
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              id: "before",
              title: "Before",
              text: "Map, weather and what to bring",
            },
            {
              id: "during",
              title: "During",
              text: "Clock in and who's on the walk",
            },
            {
              id: "after",
              title: "After",
              text: "Who attended and the journey",
            },
          ].map((phase) => (
            <section
              className={cn(
                "flex flex-col gap-1 rounded-xl border p-4",
                phase.id === current
                  ? "border-2 border-emerald-700 bg-emerald-50 dark:bg-emerald-950"
                  : "opacity-70",
              )}
              key={phase.id}
            >
              <h2 className="text-xs font-semibold tracking-wider uppercase">
                {phase.title}
                {phase.id === current ? " · now" : ""}
              </h2>
              <p className="text-sm text-muted-foreground">{phase.text}</p>
            </section>
          ))}
        </div>
      );
    }
    default:
      return (
        <section
          className={cn(
            "flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
            info.now.tone,
          )}
        >
          <div className="flex flex-col gap-0.5" suppressHydrationWarning>
            <span className="text-xs font-semibold tracking-wider uppercase">
              {info.now.eyebrow}
            </span>
            <span className="text-lg font-semibold">{info.now.line}</span>
          </div>
        </section>
      );
  }
}

/** The meeting-point map, in the look and with the buttons chosen in the designer. */
export function MapBlock(look: MapLook) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Map and directions" />;
  return <MapLookProvider value={look}>{p.map}</MapLookProvider>;
}

/** Get directions and Apple Maps on their own, to place anywhere. */
export function DirectionsBlock({ full = false }: { full?: boolean }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Directions buttons" />;
  if (!p.meeting) return null;
  return (
    <DirectionsButtons
      className={full ? "sm:grid sm:grid-cols-2" : undefined}
      location={p.meeting}
    />
  );
}
export const WeatherBlock = withParts("Weather forecast", (p) => (
  <>{p.forecast}</>
));
export const PreciseBlock = withParts("Precise location (what3words)", (p) => (
  <>{p.precise}</>
));
export const BeforeBlock = withParts("Before you set off", (p) => (
  <>{p.before}</>
));
export const AttendedBlock = withParts("Attended (organisers only)", (p) => (
  <>{p.attended?.content ?? null}</>
));
export const JourneyBlock = withParts("Journey", (p) => (
  <>{p.journey?.content ?? null}</>
));

export function SummaryTilesBlock({ arrange = "fill" }: { arrange?: Arrange }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Summary tiles" />;
  const tiles = [
    ...(p.attended
      ? [
          {
            icon: Users,
            label: "Attended",
            value:
              p.attended.count == null ? "See who" : String(p.attended.count),
          },
        ]
      : []),
    ...(p.meeting
      ? [{ icon: MapPin, label: "Meeting point", value: p.meeting }]
      : []),
    { icon: CloudSun, label: "Weather", value: "Forecast for the day" },
    ...(p.journey
      ? [
          {
            icon: Footprints,
            label: "Journey",
            value: `${p.journey.count} moments`,
          },
        ]
      : []),
  ];
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]",
        arrange === "scroll" && cn(SWIPE, "[&>*]:w-48"),
      )}
    >
      {tiles.map((tile) => (
        <div
          className="flex min-w-0 flex-col gap-1 rounded-xl border p-4"
          key={tile.label}
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <tile.icon aria-hidden className="size-3.5" />
            {tile.label}
          </span>
          <span
            className="truncate text-xl font-semibold"
            suppressHydrationWarning
          >
            {tile.value}
          </span>
          <ChevronRight
            aria-hidden
            className="size-3.5 text-muted-foreground"
          />
        </div>
      ))}
    </div>
  );
}

export function PeopleStackBlock() {
  const p = useWalkParts();
  if (!p) return <Placeholder label="People clocked in (count)" />;
  if (!p.attended?.count) return null;
  return (
    <div className="flex items-center gap-2">
      <div aria-hidden className="flex -space-x-2">
        {Array.from({ length: Math.min(4, p.attended.count) }).map((_, i) => (
          <span
            className={cn(
              "size-7 rounded-full border-2 border-background",
              ["bg-emerald-200", "bg-amber-200", "bg-sky-200", "bg-rose-200"][
                i
              ],
            )}
            key={i}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {p.attended.count} clocked in
      </span>
    </div>
  );
}

// ── Layout blocks ───────────────────────────────────────────────────────
/**
 * A sidebar beside the page on a computer; on a phone it opens from a button
 * as a panel over the page (✕, a tap outside, or Escape closes it).
 */
export function MobileSidebar({
  children,
  label,
  side = "left",
}: {
  children: ReactNode;
  label: string;
  side?: "left" | "right";
}) {
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
      <Button
        className="w-full lg:hidden"
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="outline"
      >
        <PanelLeft data-icon="inline-start" />
        {label}
      </Button>
      {open ? (
        <div
          aria-hidden
          className="fixed inset-0 z-[70] bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
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
            <Button
              aria-label="Close"
              onClick={() => setOpen(false)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          </div>
        ) : null}
        {children}
      </aside>
    </>
  );
}

// ── More blocks from the walk page designs ──────────────────────────────
export const HowItWorksBlock = withParts(
  "How this group works (signed-out visitors)",
  (p) => <>{p.howItWorks ?? null}</>,
);

/** Cards to swipe through: when, where, weather, people, journey. */
export function StoryCardsBlock({ arrange = "fill" }: { arrange?: Arrange }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Story cards" />;
  return <StoryCards arrange={arrange} p={p} />;
}

function StoryCards({ p, arrange }: { p: WalkIdeaParts; arrange: Arrange }) {
  const info = useWalkInfo(p);
  const cards = [
    {
      icon: CalendarDays,
      label: "When",
      value: `${formatWalkDay(info.start)}, ${formatTime(info.start)}`,
      sub: `Back by ${formatTime(info.end)}`,
      tone: "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-50",
    },
    {
      icon: MapPin,
      label: "Where",
      value: p.meeting ?? "—",
      sub: p.what3words ? `///${p.what3words}` : "Map and directions",
      tone: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50",
    },
    {
      icon: CloudSun,
      label: "Weather",
      value: "Forecast",
      sub: "Hour by hour for the walk",
      tone: "bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-50",
    },
    ...(p.attended
      ? [
          {
            icon: Users,
            label: "People",
            value:
              p.attended.count == null ? "See who" : `${p.attended.count} in`,
            sub: "Who's on the walk",
            tone: "bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-50",
          },
        ]
      : []),
    ...(p.journey
      ? [
          {
            icon: Footprints,
            label: "Journey",
            value: `${p.journey.count}`,
            sub: "moments so far",
            tone: "bg-violet-100 text-violet-950 dark:bg-violet-950 dark:text-violet-50",
          },
        ]
      : []),
  ];
  return (
    <div
      className={
        arrange === "scroll"
          ? cn(SWIPE, "gap-3 [&>*]:w-44 sm:[&>*]:w-52")
          : "grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]"
      }
    >
      {cards.map((card) => (
        <div
          className={cn(
            "flex min-w-0 flex-col justify-between gap-6 rounded-2xl p-4",
            card.tone,
          )}
          key={card.label}
        >
          <card.icon aria-hidden className="size-5" />
          <span className="flex flex-col">
            <span className="text-xs font-semibold uppercase opacity-70">
              {card.label}
            </span>
            <span
              className="truncate text-lg font-semibold"
              suppressHydrationWarning
            >
              {card.value}
            </span>
            <span className="truncate text-xs opacity-70">{card.sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Boxes of different sizes: the walk, Clock in + Manage, meeting point, people, walk numbers. */
export function BentoBlock() {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Bento grid" />;
  return <Bento p={p} />;
}

function Bento({ p }: { p: WalkIdeaParts }) {
  const info = useWalkInfo(p);
  const h = p.headline;
  const tile = (
    label: string,
    value: string,
    sub?: string | null,
    wide = false,
  ) => (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-2xl border p-4",
        wide && "sm:col-span-2",
      )}
      key={label}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className="truncate text-2xl font-semibold"
        suppressHydrationWarning
      >
        {value}
      </span>
      {sub ? (
        <span className="truncate text-xs text-muted-foreground">{sub}</span>
      ) : null}
    </div>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <section className="flex flex-col gap-1 rounded-2xl bg-muted/60 p-5 sm:col-span-3">
        <StatusLine p={p} />
        <h2 className="text-xl font-semibold sm:text-2xl">{h.title}</h2>
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          {formatWalkDay(info.start)}, {formatTime(info.start)} to{" "}
          {formatTime(info.end)}
        </p>
      </section>
      <section className="flex flex-col justify-between gap-3 rounded-2xl border p-4 [&_button]:w-full">
        <span className="text-sm text-muted-foreground">Actions</span>
        <Actions p={p} />
      </section>
      {tile(
        "Meeting point",
        p.meeting ?? "—",
        p.what3words ? `///${p.what3words}` : null,
        true,
      )}
      {p.attended
        ? tile(
            "Attended",
            p.attended.count == null ? "See who" : String(p.attended.count),
          )
        : null}
      {tile(
        "Walk",
        [h.distance, h.grade].filter(Boolean).join(" · ") ||
          formatWalkLength(h.durationMins),
        h.elevationGain,
      )}
    </div>
  );
}

export type TicketVariant = "plain" | "colour";

/** A walk pass: date and times like a ticket, Clock in + Manage on its stub. */
export function TicketBlock({
  variant = "plain",
}: {
  variant?: TicketVariant;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Walk ticket · ${variant}`} />;
  return <Ticket p={p} variant={variant} />;
}

function Ticket({ p, variant }: { p: WalkIdeaParts; variant: TicketVariant }) {
  const info = useWalkInfo(p);
  const colour = variant === "colour";
  const rows = [
    ["Date", formatWalkDay(info.start)],
    ["Sets off", formatTime(info.start)],
    ["Back by", formatTime(info.end)],
    ["Meet at", p.meeting],
    ["Distance", p.headline.distance],
    ["Leader", p.headline.walkLeader],
  ].filter(([, value]) => value) as [string, string][];
  return (
    <section
      className={cn(
        "grid overflow-hidden rounded-2xl shadow-sm sm:grid-cols-[minmax(0,1fr)_14rem]",
        colour ? "bg-sky-600 text-white" : "border bg-card",
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <span
          className={cn(
            "text-xs font-semibold tracking-widest uppercase",
            colour ? "opacity-80" : "text-muted-foreground",
          )}
        >
          Walk pass
        </span>
        <h2 className="text-2xl leading-tight font-semibold sm:text-3xl">
          {p.headline.title}
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {rows.map(([label, value]) => (
            <div className="flex min-w-0 flex-col" key={label}>
              <dt
                className={cn(
                  "text-[11px] tracking-wide uppercase",
                  colour ? "opacity-70" : "text-muted-foreground",
                )}
              >
                {label}
              </dt>
              <dd
                className="truncate text-lg font-semibold"
                suppressHydrationWarning
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div
        className={cn(
          "flex flex-col justify-between gap-3 border-t-2 border-dashed p-5 sm:border-t-0 sm:border-l-2",
          colour && "border-white/40 bg-sky-700",
        )}
      >
        <span className="flex flex-col" suppressHydrationWarning>
          <span className="text-4xl font-black">{info.countdown.value}</span>
          <span
            className={cn(
              "text-xs uppercase",
              colour ? "opacity-80" : "text-muted-foreground",
            )}
          >
            {info.countdown.unit}
          </span>
        </span>
        <div className="[&_button]:w-full">
          <Actions p={p} />
        </div>
      </div>
    </section>
  );
}

/** Before, During and After as columns holding the real parts; the current one stands out. */
export function PhasesBoardBlock() {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Phases board (Before · During · After)" />;
  return <PhasesBoard p={p} />;
}

function PhasesBoard({ p }: { p: WalkIdeaParts }) {
  const info = useWalkInfo(p);
  const current =
    info.status === "completed"
      ? "after"
      : info.status === "in-progress"
        ? "during"
        : "before";
  const column = (id: string, heading: string, content: ReactNode) => (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-2xl border p-4",
        id === current
          ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 dark:bg-emerald-950/30"
          : "bg-muted/20",
      )}
      key={id}
    >
      <h2 className="flex items-center justify-between text-sm font-semibold">
        {heading}
        {id === current ? (
          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] text-white">
            Now
          </span>
        ) : null}
      </h2>
      {content}
    </section>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {column(
        "before",
        "Before",
        <>
          {p.map}
          {p.forecast}
          {p.before}
        </>,
      )}
      {column(
        "during",
        "During",
        <>
          {p.precise}
          {p.attended?.content ?? null}
        </>,
      )}
      {column(
        "after",
        "After",
        p.journey?.content ?? (
          <p className="text-sm text-muted-foreground">
            The journey will appear here.
          </p>
        ),
      )}
    </div>
  );
}

/** The key facts as a grid of coloured blocks. */
export function ColourBlocksBlock({ arrange = "fill" }: { arrange?: Arrange }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Colour blocks" />;
  return <ColourBlocks arrange={arrange} p={p} />;
}

function ColourBlocks({ p, arrange }: { p: WalkIdeaParts; arrange: Arrange }) {
  const info = useWalkInfo(p);
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-4",
        arrange === "scroll" && cn(SWIPE, "[&>*]:w-48"),
      )}
    >
      <div
        className={cn(
          "col-span-2 flex flex-col justify-between gap-6 rounded-2xl p-5",
          info.now.tone,
        )}
        suppressHydrationWarning
      >
        <span className="text-xs font-bold uppercase">{info.now.eyebrow}</span>
        <span className="text-xl font-bold">{info.now.line}</span>
      </div>
      <div
        className="flex flex-col justify-between gap-6 rounded-2xl bg-amber-300 p-5 text-amber-950"
        suppressHydrationWarning
      >
        <Clock aria-hidden className="size-5" />
        <span className="text-2xl font-bold">{formatTime(info.start)}</span>
      </div>
      <div className="flex flex-col justify-between gap-6 rounded-2xl bg-sky-300 p-5 text-sky-950">
        <Footprints aria-hidden className="size-5" />
        <span className="text-2xl font-bold">
          {p.headline.distance ?? formatWalkLength(p.headline.durationMins)}
        </span>
      </div>
      <div className="col-span-2 flex flex-col justify-between gap-6 rounded-2xl bg-rose-300 p-5 text-rose-950">
        <MapPin aria-hidden className="size-5" />
        <span className="truncate text-lg font-bold">{p.meeting ?? "—"}</span>
      </div>
      <div className="col-span-2 flex flex-col justify-between gap-6 rounded-2xl bg-violet-300 p-5 text-violet-950">
        <TrendingUp aria-hidden className="size-5" />
        <span className="truncate text-lg font-bold">
          {[p.headline.grade, p.headline.elevationGain]
            .filter(Boolean)
            .join(" · ") || "—"}
        </span>
      </div>
    </div>
  );
}

/** Round badges for the walk's numbers. */
export function BadgesBlock({ arrange = "fill" }: { arrange?: Arrange }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Round badges" />;
  const h = p.headline;
  const start = new Date(h.startsAt);
  const badges = [
    {
      label: "Grade",
      value: h.grade ?? "—",
      tone: "bg-emerald-500 text-white",
    },
    {
      label: "Distance",
      value: h.distance ?? "—",
      tone: "bg-sky-500 text-white",
    },
    {
      label: "Climb",
      value: h.elevationGain ?? "—",
      tone: "bg-amber-500 text-amber-950",
    },
    {
      label: "Starts",
      value: formatTime(start),
      tone: "bg-rose-500 text-white",
    },
    {
      label: "Hours",
      value: (h.durationMins / 60).toFixed(1).replace(/\.0$/, ""),
      tone: "bg-violet-500 text-white",
    },
  ];
  return (
    <div
      className={
        arrange === "scroll"
          ? cn(SWIPE, "gap-4 py-1")
          : "flex flex-wrap justify-between gap-4"
      }
    >
      {badges.map((badge) => (
        <div
          className={cn(
            "flex size-24 flex-col items-center justify-center rounded-full text-center shadow-md ring-4 ring-background",
            badge.tone,
          )}
          key={badge.label}
        >
          <span
            className="max-w-20 truncate text-lg leading-tight font-black"
            suppressHydrationWarning
          >
            {badge.value}
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Single pieces, to place anywhere ─────────────────────────────────────
export const FACT_NAMES = [
  "Date",
  "Starts",
  "Finishes",
  "Length",
  "Meeting point",
  "what3words",
  "Distance",
  "Climb",
  "Grade",
  "Walk leader",
  "Back marker",
] as const;
export type FactName = (typeof FACT_NAMES)[number];
export type FactLook = "line" | "tile" | "big";

/** One fact on its own (members only see it when it's filled in). */
export function FactBlock({
  fact = "Date",
  look = "tile",
}: {
  fact?: FactName;
  look?: FactLook;
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Fact · ${fact}`} />;
  return <OneFact fact={fact} look={look} p={p} />;
}

function OneFact({
  p,
  fact,
  look,
}: {
  p: WalkIdeaParts;
  fact: FactName;
  look: FactLook;
}) {
  const found = useWalkInfo(p).facts.find((item) => item.label === fact);
  if (!found) return null;
  if (look === "line")
    return (
      <p className="flex items-center gap-2 text-sm" suppressHydrationWarning>
        <found.icon aria-hidden className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">{found.label}</span>
        <span className="font-medium">{found.value}</span>
      </p>
    );
  if (look === "big")
    return (
      <div className="flex flex-col">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <found.icon aria-hidden className="size-4" />
          {found.label}
        </span>
        <span
          className="text-3xl font-semibold tracking-tight break-words sm:text-4xl"
          suppressHydrationWarning
        >
          {found.value}
        </span>
      </div>
    );
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-muted/60 p-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <found.icon aria-hidden className="size-3.5" />
        {found.label}
      </span>
      <span
        className="text-sm font-semibold break-words"
        suppressHydrationWarning
      >
        {found.value}
      </span>
    </div>
  );
}

export type CountdownLook = "big" | "box" | "pill";

/** How long until the walk sets off (or finishes, while it's under way). */
export function CountdownBlock({ look = "big" }: { look?: CountdownLook }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label={`Countdown · ${look}`} />;
  return <Countdown look={look} p={p} />;
}

function Countdown({ p, look }: { p: WalkIdeaParts; look: CountdownLook }) {
  const { countdown, now } = useWalkInfo(p);
  if (look === "pill")
    return (
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
          now.tone,
        )}
        suppressHydrationWarning
      >
        <Clock aria-hidden className="size-3.5" />
        {countdown.value} {countdown.unit}
      </span>
    );
  return (
    <div
      className={cn(
        "flex flex-col",
        look === "box" && cn("rounded-2xl p-5", now.tone),
      )}
      suppressHydrationWarning
    >
      <span className="text-5xl font-black tracking-tight sm:text-6xl">
        {countdown.value}
      </span>
      <span className="text-sm text-muted-foreground uppercase">
        {countdown.unit}
      </span>
    </div>
  );
}

/** The walk's status badge (Upcoming, Clock-in open, In progress…), with its line of words or without. */
export function StatusBadgeBlock({ withLine = true }: { withLine?: boolean }) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Status badge" />;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge p={p} />
      {withLine ? <StatusLine p={p} /> : null}
    </div>
  );
}

/** The day's timeline: clock-in opens, set off, finish, and how far along it is. */
export const TimelineBlock = withParts("The day's timeline", (p) => (
  <Timeline p={p} />
));

/** The walk's name on its own. */
export function WalkNameBlock({
  size = "large",
}: {
  size?: "small" | "large" | "huge";
}) {
  const p = useWalkParts();
  if (!p) return <Placeholder label="Walk name" />;
  return (
    <h1
      className={cn(
        "leading-tight font-semibold tracking-tight text-balance",
        size === "small" && "text-xl",
        size === "large" && "text-2xl sm:text-3xl",
        size === "huge" && "text-4xl font-black sm:text-6xl",
      )}
    >
      {p.headline.title}
    </h1>
  );
}
