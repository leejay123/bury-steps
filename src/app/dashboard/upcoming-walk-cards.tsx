"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, MapPin } from "lucide-react";
import { formatDateTime, formatWalkDate } from "@/lib/dates";
import { walkSharePath } from "@/lib/walk-slug";
import { cn } from "@/lib/utils";
import { windowState, type WindowState } from "@/lib/walk-window";
import { Badge } from "@/components/ui/badge";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalkClock } from "@/hooks/use-walk-clock";

export type UpcomingWalkCard = {
  id: string;
  token: string;
  slug: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  durationMins: number;
  cancelledAt: string | null;
  clockedInAt: string | null;
  /** Kept for SSR first paint; the card recomputes live with useWalkClock. */
  state: WindowState;
  memberCount: number;
};

function walkMemberCountLabel(count: number) {
  if (count === 0) return "No one else has clocked in yet.";
  if (count === 1) return "1 person is on this walk.";
  return `${count} people are on this walk.`;
}

function walkLinkLabel(walk: UpcomingWalkCard, state: WindowState) {
  if (walk.cancelledAt) return `${walk.title} — view walk details`;
  if (walk.clockedInAt) return `${walk.title} — view walk details`;
  if (state === "open") return `${walk.title} — clock in`;
  if (state === "closed") return `${walk.title} — view walk details`;
  return `${walk.title} — open pre-walk check`;
}

function UpcomingWalkCardRow({ walk }: { walk: UpcomingWalkCard }) {
  const now = useWalkClock({
    cancelledAt: walk.cancelledAt,
    durationMins: walk.durationMins,
    startsAt: walk.startsAt,
  });
  const state = walk.cancelledAt
    ? "closed"
    : windowState(new Date(walk.startsAt), walk.durationMins, now);

  return (
    <Card className="relative gap-3 transition-colors hover:bg-muted/40">
      {/*
        A single real link stretched over the whole card (rather than a
        clickable `role="button"` wrapper around a *second*, separately
        focusable "Clock in" link) — nesting an interactive element
        inside another interactive element confuses screen readers and
        breaks keyboard focus order. Everything below is presentational;
        this is the only focus stop and the only thing a screen reader
        announces as interactive.
      */}
      <Link
        aria-label={walkLinkLabel(walk, state)}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        href={walkSharePath(walk)}
      />
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle className="text-base">{walk.title}</CardTitle>
          <CardDescription className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {formatWalkDate(new Date(walk.startsAt))}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-3.5" />
              {walk.durationMins} min
              {walk.location ? (
                <>
                  <MapPin aria-hidden="true" className="ml-1.5 size-3.5" />
                  {walk.location}
                </>
              ) : null}
            </span>
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <WalkStatusBadge
            cancelledAt={walk.cancelledAt}
            durationMins={walk.durationMins}
            startsAt={walk.startsAt}
          />
          {walk.clockedInAt && !walk.cancelledAt ? (
            <Badge variant="secondary">Clocked in</Badge>
          ) : null}
          <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {walk.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {walk.description}
          </p>
        ) : null}
        {walk.cancelledAt ? (
          <p className="text-sm text-destructive">This walk has been cancelled.</p>
        ) : null}
        {!walk.cancelledAt && !walk.clockedInAt && state !== "closed" ? (
          // Purely visual — the stretched link above already goes to
          // this same destination, so this isn't a second real button.
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-9 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs",
              state === "too-early" && "opacity-50",
            )}
          >
            {state === "open" ? "Clock in" : "Open pre-walk check"}
          </span>
        ) : null}
        {walk.clockedInAt && !walk.cancelledAt ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-muted-foreground">
              Clocked in at {formatDateTime(new Date(walk.clockedInAt))}
            </p>
            {/* No clock-out button here on purpose — clocking out is a
            deliberate action, so it only lives on the walk's own page
            (opened by tapping the card), not as a one-tap action on the
            card that also navigates elsewhere. */}
            <p className="text-sm text-muted-foreground">
              {walkMemberCountLabel(walk.memberCount)}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function UpcomingWalkCards({ walks }: { walks: UpcomingWalkCard[] }) {
  return (
    <div className="flex flex-col gap-4">
      {walks.map((walk) => (
        <UpcomingWalkCardRow key={walk.id} walk={walk} />
      ))}
    </div>
  );
}
