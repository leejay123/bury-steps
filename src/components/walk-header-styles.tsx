"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { useWalkClock } from "@/hooks/use-walk-clock";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { meetingPointLabel } from "@/lib/geocode";
import { cn } from "@/lib/utils";
import { effectiveEndsAt, walkOpensAt, walkStatus } from "@/lib/walk-window";
import type { WalkHeaderStyle } from "@/lib/walk-page-sections";
import { Button } from "@/components/ui/button";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { walkHeadlineFacts, type WalkHeadlineProps } from "@/components/walk-headline";

export type WalkTiming = {
  cancelledAt: string | null;
  durationMins: number;
  endedAt: string | null;
  startsAt: string;
};

/**
 * What's happening with the walk right now, in words, and the colour that
 * goes with it — for C's status box and H2's and H3's status lines. Ticks
 * with the walk clock, so a page left open moves on by itself.
 */
export function useWalkNow(timing: WalkTiming, clockedIn: number | null) {
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
  const live = "bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50";
  if (status === "cancelled") {
    return { eyebrow: "Cancelled", line: "This walk isn't going ahead", tone: "bg-destructive/10 text-destructive", live: false };
  }
  if (status === "upcoming") {
    return {
      eyebrow: "Upcoming",
      line: `Clock-in opens at ${formatTime(opensAt)} on ${formatWalkDay(opensAt, now)}`,
      tone: "bg-muted text-foreground",
      live: false,
    };
  }
  if (status === "starting-soon") {
    return { eyebrow: "Clock-in open", line: `Starts at ${formatTime(walk.startsAt)}${count}`, tone: live, live: true };
  }
  if (status === "in-progress") {
    return {
      eyebrow: "In progress",
      line: `Finishes at ${formatTime(effectiveEndsAt(walk))}${count}`,
      tone: live,
      live: true,
    };
  }
  return {
    eyebrow: "Finished",
    line: clockedIn === null ? "This walk has finished" : `${clockedIn} attended`,
    tone: "bg-muted text-foreground",
    live: false,
  };
}

const LABEL = "text-xs font-semibold tracking-wider text-muted-foreground uppercase";

/**
 * The title and the walk's controls for the tabbed layouts, in the style
 * chosen in Settings → Site wording → Walk page cards → Header (H1 to H4).
 * The controls are the organiser's (members have none, so only the title
 * part shows for them). Buttons are full width on a phone.
 */
export function WalkHeader({
  clockedIn,
  headline,
  liveCompact,
  share,
  style,
  timing,
  tools,
  what3words,
}: {
  clockedIn: number | null;
  headline: Omit<WalkHeadlineProps, "action">;
  liveCompact?: ReactNode;
  share?: ReactNode;
  style: Exclude<WalkHeaderStyle, "standard">;
  timing: WalkTiming;
  tools?: ReactNode;
  what3words: string | null;
}) {
  const [open, setOpen] = useState(false);
  const facts = walkHeadlineFacts(headline);
  const now = useWalkNow(timing, clockedIn);
  const badge = (
    <WalkStatusBadge
      cancelledAt={headline.cancelledAt}
      className="shrink-0"
      durationMins={headline.durationMins}
      endedAt={headline.endedAt}
      startsAt={headline.startsAt}
    />
  );
  const note = headline.note ? <p className="text-xs text-muted-foreground">{headline.note}</p> : null;
  // The rest of the walk's buttons, opened by More (H1) or Manage (H3).
  const openPanel = open ? (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:flex-wrap sm:items-start">
      {style === "band" ? share : null}
      {tools}
    </div>
  ) : null;

  if (style === "buttons") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="min-w-0 text-2xl leading-tight font-semibold sm:text-3xl">{headline.title}</h1>
              {badge}
            </div>
            <ul className="flex flex-wrap gap-1.5" suppressHydrationWarning>
              {facts.map((fact) => (
                <li className="rounded-full bg-muted px-2.5 py-1 text-xs sm:text-sm" key={fact}>
                  {fact}
                </li>
              ))}
            </ul>
            {note}
          </div>
          {liveCompact || share || tools ? (
            <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row sm:items-center">
              {liveCompact}
              {share}
              {tools ? (
                <Button
                  aria-expanded={open}
                  className="w-full sm:w-auto"
                  onClick={() => setOpen((value) => !value)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <MoreHorizontal data-icon="inline-start" />
                  More
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {openPanel}
      </div>
    );
  }

  if (style === "toolbar") {
    const start = new Date(headline.startsAt);
    const meeting = meetingPointLabel(headline.location, headline.postcode);
    const stats = [
      { label: "Starts", value: formatTime(start), sub: formatWalkDay(start) },
      { label: "Length", value: formatWalkLength(headline.durationMins), sub: headline.distance },
      { label: "Grade", value: headline.grade ?? "—", sub: headline.elevationGain },
      { label: "Meet at", value: meeting ?? "—", sub: what3words ? `///${what3words}` : null },
    ];
    return (
      <div className="flex flex-col gap-5">
        {liveCompact || share || tools ? (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-2 sm:flex-row sm:flex-wrap sm:items-center">
            {liveCompact}
            {share}
            {tools}
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-medium" suppressHydrationWarning>
            <span
              aria-hidden
              className={cn("size-2 rounded-full", now.live ? "bg-emerald-500" : "bg-muted-foreground/50")}
            />
            {now.eyebrow} · {now.line}
          </span>
          <h1 className="text-3xl leading-tight font-semibold sm:text-4xl">{headline.title}</h1>
          {headline.walkLeader || headline.note ? (
            <p className="text-sm text-muted-foreground">
              {[headline.note, headline.walkLeader ? `Led by ${headline.walkLeader}` : null].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
        <dl className="grid grid-cols-2 border-y sm:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              className={cn(
                "flex min-w-0 flex-col gap-0.5 py-3 sm:px-4 sm:first:pl-0",
                i % 2 === 1 && "max-sm:border-l max-sm:pl-4",
                i > 0 && "sm:border-l",
                i > 1 && "max-sm:border-t",
              )}
              key={stat.label}
            >
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="truncate text-lg font-semibold" suppressHydrationWarning>
                {stat.value}
              </dd>
              {stat.sub ? (
                <dd className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                  {stat.sub}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (style === "band") {
    const start = new Date(headline.startsAt);
    const rest = facts.slice(3);
    return (
      <div className="flex flex-col gap-3">
        <section className="overflow-hidden rounded-xl border">
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-sm font-medium sm:px-5",
              now.tone,
            )}
            suppressHydrationWarning
          >
            <span>
              {now.eyebrow} · {now.line}
            </span>
            <span className="font-normal">
              {formatWalkDay(start)}, {formatTime(start)} to {formatTime(effectiveEndsAt(timingDates(timing)))}
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="text-2xl leading-tight font-semibold sm:text-3xl">{headline.title}</h1>
              {rest.length > 0 ? <p className="text-sm text-muted-foreground">{rest.join(" · ")}</p> : null}
              {note}
            </div>
            {liveCompact || share || tools ? (
              <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row sm:items-center">
                {liveCompact}
                {share || tools ? (
                  <Button
                    aria-expanded={open}
                    className="w-full sm:w-auto"
                    onClick={() => setOpen((value) => !value)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Manage
                    <ChevronDown className={cn("transition-transform", open && "rotate-180")} data-icon="inline-end" />
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
        {openPanel}
      </div>
    );
  }

  // H4, grouped: the title, then the controls in two labelled boxes.
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl leading-tight font-semibold sm:text-3xl">{headline.title}</h1>
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"
          suppressHydrationWarning
        >
          {badge}
          {facts.map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </div>
        {note}
      </div>
      {liveCompact || share || tools ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          {liveCompact || share ? (
            <section className="flex flex-col gap-2 rounded-xl border p-3">
              <span className={LABEL}>You</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {liveCompact}
                {share}
              </div>
            </section>
          ) : null}
          {tools ? (
            <section className="flex min-w-0 flex-col gap-2 rounded-xl border p-3">
              <span className={LABEL}>Organise this walk</span>
              {tools}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function timingDates(timing: WalkTiming) {
  return {
    durationMins: timing.durationMins,
    endedAt: timing.endedAt ? new Date(timing.endedAt) : null,
    startsAt: new Date(timing.startsAt),
  };
}
