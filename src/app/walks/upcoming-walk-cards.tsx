"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Clock, MapPin, Search, SearchX } from "lucide-react";
import { formatTime, formatWalkDate, formatWalkDay, formatWalkLengthShort } from "@/lib/dates";
import { InlineDescriptionText } from "@/components/description-text";
import { walkSharePath } from "@/lib/walk-slug";
import { walkOpensAt, walkStatus, windowState, type WalkStatus, type WindowState } from "@/lib/walk-window";
import { WalkStatusHeader } from "@/components/walk-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLiveNow } from "@/hooks/use-live-now";
import { useWalkClock } from "@/hooks/use-walk-clock";

// Upcoming never holds a cancelled walk — that lives in All walks instead
// (see src/app/walks/page.tsx) — nor a completed one, so both are left out
// of the filter, matching AdminWalkTable's own upcoming-scope options.
type StatusFilter = "all" | Exclude<WalkStatus, "cancelled" | "completed">;
type SortOrder = "asc" | "desc";

const ALL_STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "upcoming", label: "Upcoming" },
  { value: "starting-soon", label: "Starting soon" },
  { value: "in-progress", label: "In progress" },
];

export type UpcomingWalkCard = {
  id: string;
  token: string;
  slug: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  durationMins: number;
  clockedInAt: string | null;
  /** Set once an organiser ends the walk early — see endWalkEarly. */
  endedAt: string | null;
  /** Kept for SSR first paint; the card recomputes live with useWalkClock. */
  state: WindowState;
  memberCount: number;
};

/** Only shown while you're clocked in, so the count always includes you. */
function walkMemberCountLabel(count: number) {
  if (count <= 1) return "Just you so far.";
  if (count === 2) return "You and 1 other person are on this walk.";
  return `You and ${count - 1} others are on this walk.`;
}

function walkLinkLabel(walk: UpcomingWalkCard, state: WindowState) {
  if (walk.clockedInAt) return `${walk.title} — view walk details`;
  if (state === "open") return `${walk.title} — clock in`;
  if (state === "closed") return `${walk.title} — view walk details`;
  return `${walk.title} — view walk details`;
}

function UpcomingWalkCardRow({ walk }: { walk: UpcomingWalkCard }) {
  const now = useWalkClock({
    cancelledAt: null,
    durationMins: walk.durationMins,
    endedAt: walk.endedAt,
    startsAt: walk.startsAt,
  });
  const state = windowState(
    new Date(walk.startsAt),
    walk.durationMins,
    now,
    walk.endedAt ? new Date(walk.endedAt) : null,
  );

  return (
    <Card className="relative gap-3 overflow-hidden pt-0 transition-colors hover:bg-muted/40" data-stagger-item="">
      {/* Status and day as the card's header strip (see WalkStatusHeader). */}
      <WalkStatusHeader
        cancelledAt={null}
        className="mb-1 px-6"
        durationMins={walk.durationMins}
        endedAt={walk.endedAt}
        startsAt={walk.startsAt}
      />
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
        // Inset: the card clips anything drawn outside it (overflow-hidden),
        // which hid an outside ring completely from keyboard users.
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        href={walkSharePath(walk)}
      />
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <CardTitle className="text-base">{walk.title}</CardTitle>
          <CardDescription className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-3.5" />
              {formatTime(new Date(walk.startsAt))} · {formatWalkLengthShort(walk.durationMins)}
            </span>
            {walk.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                {walk.location}
              </span>
            ) : null}
          </CardDescription>
        </div>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {walk.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            <InlineDescriptionText text={walk.description} />
          </p>
        ) : null}
        {!walk.clockedInAt && state === "open" ? (
          // Purely visual — the stretched link above already goes to
          // this same destination, so this isn't a second real button.
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs"
          >
            Clock in
          </span>
        ) : !walk.clockedInAt && state === "too-early" ? (
          <p className="text-sm text-muted-foreground">
            Clock-in opens at {formatTime(walkOpensAt(new Date(walk.startsAt)))} on{" "}
            {formatWalkDay(walkOpensAt(new Date(walk.startsAt)))}.
          </p>
        ) : null}
        {walk.clockedInAt ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-muted-foreground">
              Clocked in at {formatWalkDate(walk.clockedInAt)}
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
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const now = useLiveNow();
  const router = useRouter();

  // Only offer statuses at least one walk currently has — no picking
  // "Starting soon" when nothing's starting soon.
  const statusOptions = useMemo(() => {
    const present = new Set(
      walks.map((walk) =>
        walkStatus(
          {
            cancelledAt: null,
            startsAt: new Date(walk.startsAt),
            durationMins: walk.durationMins,
            endedAt: walk.endedAt ? new Date(walk.endedAt) : null,
          },
          now,
        ),
      ),
    );
    return ALL_STATUS_OPTIONS.filter(
      (option) => option.value === "all" || present.has(option.value),
    );
  }, [now, walks]);

  // A walk changing status can take away the filter's option — fall back to
  // All in the same render rather than showing an empty list for a frame.
  if (statusFilter !== "all" && !statusOptions.some((option) => option.value === statusFilter)) {
    setStatusFilter("all");
  }

  // Keep the SSR tab count in sync once a walk finishes on an open page.
  const needsRefresh = walks.some((walk) => {
    const endedAt = walk.endedAt ? new Date(walk.endedAt) : null;
    return windowState(new Date(walk.startsAt), walk.durationMins, now, endedAt) === "closed";
  });
  useEffect(() => {
    if (needsRefresh) router.refresh();
  }, [needsRefresh, router]);

  const filtered = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const rows = walks.filter((walk) => {
      const start = new Date(walk.startsAt);
      const endedAt = walk.endedAt ? new Date(walk.endedAt) : null;
      // Drop finished walks client-side so a tab left open past end does not
      // keep them on Upcoming until the next navigation.
      if (windowState(start, walk.durationMins, now, endedAt) === "closed") return false;
      if (statusFilter !== "all") {
        const status = walkStatus(
          {
            cancelledAt: null,
            startsAt: start,
            durationMins: walk.durationMins,
            endedAt,
          },
          now,
        );
        if (status !== statusFilter) return false;
      }
      if (!query) return true;
      const hay = `${walk.title} ${walk.location ?? ""} ${walk.description ?? ""}`.toLowerCase();
      return hay.includes(query);
    });

    rows.sort((a, b) => {
      const delta = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return sortOrder === "asc" ? delta : -delta;
    });
    return rows;
  }, [deferredSearchTerm, now, sortOrder, statusFilter, walks]);

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("all");
    // The button disappears with the empty state; keep keyboard focus useful.
    searchRef.current?.focus();
  }

  const hasActiveFilters = deferredSearchTerm.trim() !== "" || statusFilter !== "all";

  if (walks.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays />
          </EmptyMedia>
          <EmptyTitle>No walks scheduled</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <InputGroup className="w-full min-w-0 sm:flex-1">
          <InputGroupInput
            aria-label="Search walks"
            ref={searchRef}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by walk or meeting point…"
            value={searchTerm}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Label htmlFor="walk-status">Status</Label>
          <Select onValueChange={(value) => setStatusFilter(value as StatusFilter)} value={statusFilter}>
            <SelectTrigger className="w-full sm:w-[11rem]" id="walk-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Label htmlFor="walk-sort">Sort</Label>
          <Select onValueChange={(value) => setSortOrder(value as SortOrder)} value={sortOrder}>
            <SelectTrigger className="w-full sm:w-[11rem]" id="walk-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Soonest first</SelectItem>
              <SelectItem value="desc">Latest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        hasActiveFilters ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No walks match your search</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={clearFilters} type="button" variant="outline">
                <SearchX data-icon="inline-start" />
                Clear search
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDays />
              </EmptyMedia>
              <EmptyTitle>
                {needsRefresh ? "Updating upcoming walks…" : "No walks scheduled"}
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        )
      ) : (
        filtered.map((walk) => <UpcomingWalkCardRow key={walk.id} walk={walk} />)
      )}
    </div>
  );
}
