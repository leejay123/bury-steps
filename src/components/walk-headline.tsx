"use client";

import type { ReactNode } from "react";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { meetingPointLabel } from "@/lib/geocode";
import { WalkStatusBadge } from "@/components/walk-status-badge";

export type WalkHeadlineProps = {
  /** Beside the title on a computer, under it on a phone (D's Manage walk). */
  action?: ReactNode;
  cancelledAt: string | null;
  distance: string | null;
  durationMins: number;
  endedAt: string | null;
  grade: string | null;
  location: string | null;
  /** A small line under the facts, e.g. "Created by … (Owner)". */
  note?: ReactNode;
  postcode: string | null;
  startsAt: string;
  title: string;
  walkLeader: string | null;
  /** Only shown by the H2 header's key facts (walk-header-styles.tsx). */
  elevationGain?: string | null;
};

/** The facts, in order, as short bits of text: day, time, length, meeting point, distance, grade, leader. */
export function walkHeadlineFacts(walk: Omit<WalkHeadlineProps, "action" | "note" | "title">): string[] {
  const start = new Date(walk.startsAt);
  return [
    formatWalkDay(start),
    formatTime(start),
    formatWalkLength(walk.durationMins),
    meetingPointLabel(walk.location, walk.postcode),
    walk.distance,
    walk.grade,
    walk.walkLeader ? `Led by ${walk.walkLeader}` : null,
  ].filter((fact): fact is string => Boolean(fact));
}

/**
 * The walk's name, status and the key facts on one line ("Sun 11 Oct ·
 * 13:45 · 1 hour 30 minutes · M45 7QJ · 2 · Easy · Led by D Henry"), for
 * the one-column tabbed walk page layouts (walk-tabs-layout.tsx), where the
 * full fact tiles sit in the Overview tab. In the browser, because the day
 * ("Today", "Tomorrow") depends on the clock.
 */
export function WalkHeadline({
  action,
  cancelledAt,
  durationMins,
  endedAt,
  note,
  startsAt,
  title,
  ...walk
}: WalkHeadlineProps) {
  const facts = walkHeadlineFacts({ cancelledAt, durationMins, endedAt, startsAt, ...walk });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* The page's one <h1>. */}
          <h1 className="min-w-0 text-2xl leading-tight font-semibold sm:text-3xl">{title}</h1>
          <WalkStatusBadge
            cancelledAt={cancelledAt}
            className="shrink-0"
            durationMins={durationMins}
            endedAt={endedAt}
            startsAt={startsAt}
          />
        </div>
        <p className="text-sm text-muted-foreground sm:text-base" suppressHydrationWarning>
          {facts.join(" · ")}
        </p>
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
