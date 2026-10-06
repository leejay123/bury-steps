"use client";

import { useEffect, useMemo, useRef } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useQueryChoice, useQueryText } from "@/hooks/use-filter-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Footprints, Search } from "lucide-react";
import { formatTime } from "@/lib/dates";
import { walkStatus, type WalkStatus } from "@/lib/walk-window";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListBody, DataListItem, DataListItemMain } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { useLiveNow } from "@/hooks/use-live-now";
import { WalkStatusHeader } from "@/components/walk-status-badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AdminWalkRow = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  durationMins: number;
  /** Set once an organiser ends the walk early — see endWalkEarly. */
  endedAt: string | null;
  cancelledAt: string | null;
  attendanceCount: number;
  /** This organiser is still on the walk (clocked in, not clocked out). */
  selfClockedIn?: boolean;
};

type StatusFilter = "all" | WalkStatus;
type SortOrder = "asc" | "desc";

const UPCOMING_STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "upcoming", label: "Upcoming" },
  { value: "starting-soon", label: "Starting soon" },
  { value: "in-progress", label: "In progress" },
  { value: "cancelled", label: "Cancelled" },
];

const PAST_STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const UPCOMING_STATUS_VALUES = ["all", "upcoming", "starting-soon", "in-progress", "cancelled"] as const;
const PAST_STATUS_VALUES = ["all", "completed", "cancelled"] as const;
const SORTS = ["asc", "desc"] as const;

export function AdminWalkTable(props: {
  attendanceLabel?: string;
  emptyDescription: string;
  emptyTitle: string;
  scope: "upcoming" | "past";
  walks: AdminWalkRow[];
}) {
  return (
    <NuqsAdapter>
      <AdminWalkTableInner {...props} />
    </NuqsAdapter>
  );
}

function AdminWalkTableInner({
  attendanceLabel = "Clock-ins",
  emptyDescription,
  emptyTitle,
  scope,
  walks,
}: {
  attendanceLabel?: string;
  emptyDescription: string;
  emptyTitle: string;
  /** Which status choices make sense for this tab. */
  scope: "upcoming" | "past";
  walks: AdminWalkRow[];
}) {
  const [query, setQuery] = useQueryText(scope === "upcoming" ? "q" : "pq");
  const [statusFilter, setStatusFilter] = useQueryChoice(
    scope === "upcoming" ? "status" : "pstatus",
    scope === "upcoming" ? UPCOMING_STATUS_VALUES : PAST_STATUS_VALUES,
    "all",
  );
  const [sortOrder, setSortOrder] = useQueryChoice(
    scope === "upcoming" ? "sort" : "psort",
    SORTS,
    scope === "past" ? "desc" : "asc",
  );
  const listRef = useRef<HTMLDivElement>(null);
  const allStatusOptions = scope === "upcoming" ? UPCOMING_STATUS_OPTIONS : PAST_STATUS_OPTIONS;
  const now = useLiveNow();
  const router = useRouter();

  // Only offer statuses that at least one walk on this tab actually has —
  // no picking "Cancelled" when nothing's cancelled.
  const statusOptions = useMemo(() => {
    const present = new Set(
      walks
        .map((walk) =>
          walkStatus(
            {
              cancelledAt: walk.cancelledAt ? new Date(walk.cancelledAt) : null,
              startsAt: new Date(walk.startsAt),
              durationMins: walk.durationMins,
              endedAt: walk.endedAt ? new Date(walk.endedAt) : null,
            },
            now,
          ),
        )
        // Completed rows are hidden from Upcoming until the server-side
        // split lands (see upcomingNeedsServerSplit below), so don't offer
        // "Completed" as a filter there either.
        .filter((status) => !(scope === "upcoming" && status === "completed")),
    );
    return allStatusOptions.filter(
      (option) => option.value === "all" || present.has(option.value as WalkStatus),
    );
  }, [allStatusOptions, now, scope, walks]);

  // A walk changing status can take away the filter's option — fall back to
  // All in the same render rather than showing an empty list for a frame.
  if (statusFilter !== "all" && !statusOptions.some((option) => option.value === statusFilter)) {
    setStatusFilter("all");
  }

  // Upcoming is SSR-split from History. Dropping a finished walk client-side
  // alone would hide it from both tabs until the next navigation — refresh
  // so it reappears under History and the tab counts stay honest.
  const upcomingNeedsServerSplit =
    scope === "upcoming" &&
    walks.some((walk) => {
      const status = walkStatus(
        {
          cancelledAt: walk.cancelledAt ? new Date(walk.cancelledAt) : null,
          startsAt: new Date(walk.startsAt),
          durationMins: walk.durationMins,
          endedAt: walk.endedAt ? new Date(walk.endedAt) : null,
        },
        now,
      );
      return status === "completed";
    });

  useEffect(() => {
    if (upcomingNeedsServerSplit) router.refresh();
  }, [upcomingNeedsServerSplit, router]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = walks.filter((walk) => {
      const status = walkStatus(
        {
          cancelledAt: walk.cancelledAt ? new Date(walk.cancelledAt) : null,
          startsAt: new Date(walk.startsAt),
          durationMins: walk.durationMins,
          endedAt: walk.endedAt ? new Date(walk.endedAt) : null,
        },
        now,
      );
      // Hide finished rows under Upcoming until refresh lands; avoids a
      // Completed badge lingering on the wrong tab for up to one tick.
      if (scope === "upcoming" && status === "completed") return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!needle) return true;
      const hay = `${walk.title} ${walk.location ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });

    rows.sort((a, b) => {
      const delta = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return sortOrder === "asc" ? delta : -delta;
    });
    return rows;
  }, [now, query, scope, sortOrder, statusFilter, walks]);

  const paging = usePagedList(filtered, {
    resetKey: `${query}|${statusFilter}|${sortOrder}`,
  });

  if (walks.length === 0) {
    return <EmptyState description={emptyDescription} icon={Footprints} title={emptyTitle} />;
  }

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <InputGroup className="w-full min-w-0 sm:flex-1">
          <InputGroupInput
            aria-label={scope === "past" ? "Search past walks" : "Search upcoming walks"}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by walk or meeting point…"
            value={query}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Label htmlFor={`walk-status-${scope}`}>Status</Label>
          <Select
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            value={statusFilter}
          >
            <SelectTrigger className="w-full sm:w-[11rem]" id={`walk-status-${scope}`}>
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
          <Label htmlFor={`walk-sort-${scope}`}>Sort</Label>
          <Select onValueChange={(value) => setSortOrder(value as SortOrder)} value={sortOrder}>
            <SelectTrigger className="w-full sm:w-[11rem]" id={`walk-sort-${scope}`}>
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
        query.trim() || statusFilter !== "all" ? (
          <EmptyState
            description="Try a different search, status, or sort."
            icon={Search}
            title="No matching walks"
          />
        ) : (
          <EmptyState
            description={
              upcomingNeedsServerSplit
                ? "Moving finished walks to History…"
                : emptyDescription
            }
            icon={Footprints}
            title={upcomingNeedsServerSplit ? "Updating upcoming walks…" : emptyTitle}
          />
        )
      ) : (
        <>
          <DataList>
            {paging.paged.map((walk) => {
              const status = walkStatus(
                {
                  cancelledAt: walk.cancelledAt ? new Date(walk.cancelledAt) : null,
                  startsAt: new Date(walk.startsAt),
                  durationMins: walk.durationMins,
                  endedAt: walk.endedAt ? new Date(walk.endedAt) : null,
                },
                now,
              );
              const canClockIn = status === "starting-soon" || status === "in-progress";
              const cue =
                scope === "upcoming" && canClockIn
                  ? walk.selfClockedIn
                    ? "You're clocked in"
                    : "Clock in now"
                  : null;
              return (
              <DataListItem className="relative flex-col items-stretch gap-0 p-0" data-stagger-item="" key={walk.id}>
                {/* Status and day as the card's header strip (see WalkStatusHeader). */}
                <WalkStatusHeader
                  cancelledAt={walk.cancelledAt}
                  durationMins={walk.durationMins}
                  endedAt={walk.endedAt}
                  startsAt={walk.startsAt}
                />
                <DataListItemMain className="items-center p-3">
                  <DataListBody>
                    <p className="font-medium">
                      <Link className="after:absolute after:inset-0" href={`/admin/walks/${walk.id}`}>
                        {walk.title}
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(new Date(walk.startsAt))}
                      {walk.location ? ` · ${walk.location}` : ""}
                    </p>
                    {/* Nobody yet on a walk that may not have started says
                        nothing useful, so it's left off. */}
                    {scope === "upcoming" && walk.attendanceCount === 0 ? null : (
                      <p className="text-xs text-muted-foreground">
                        {walk.attendanceCount}{" "}
                        {walk.attendanceCount === 1 && attendanceLabel === "Clock-ins"
                          ? "clock-in"
                          : attendanceLabel.toLowerCase()}
                      </p>
                    )}
                    {cue ? <p className="text-sm font-medium">{cue}</p> : null}
                  </DataListBody>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </DataListItemMain>
              </DataListItem>
              );
            })}
          </DataList>
          <ListPagination
            noun="walks"
            onPageChange={paging.setPage}
            page={paging.page}
            pageCount={paging.pageCount}
            pageSize={paging.pageSize}
            scrollToRef={listRef}
            total={paging.total}
          />
        </>
      )}
    </div>
  );
}
