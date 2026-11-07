"use client";

import { useEffect, useMemo, useRef } from "react";
import { IntentLink } from "@/components/intent-link";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useQueryChoice, useQueryText } from "@/hooks/use-filter-query";
import { useRouter } from "next/navigation";
import { ChevronRight, Footprints, Search } from "lucide-react";
import { formatTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { walkStatus, type WalkStatus } from "@/lib/walk-window";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListBody, DataListItem, DataListItemMain } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { useLiveNow } from "@/hooks/use-live-now";
import { WalkStatusHeader } from "@/components/walk-status-badge";
import { useSiteDesign } from "@/components/site-design-context";
import { WalkTableCard, type WalkTableRow } from "@/components/walk-table-card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { ClearFiltersButton } from "@/components/empty-state";
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
  /**
   * Where the row goes: the organiser's walk page by default; the members'
   * Walks page passes the walk's own page; null makes the row unclickable
   * (a cancelled walk a member can't open).
   */
  href?: string | null;
};

type StatusFilter = "all" | WalkStatus;
/** "first": the one-list order (scope "all"): coming up (soonest first), then completed and
 * then cancelled (latest first). */
type SortOrder = "first" | "asc" | "desc";

const UPCOMING_STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "upcoming", label: "Upcoming" },
  { value: "starting-soon", label: "Starting soon" },
  { value: "in-progress", label: "In progress" },
];

const PAST_STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ALL_STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All walks" },
  { value: "upcoming", label: "Upcoming" },
  { value: "starting-soon", label: "Starting soon" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const UPCOMING_STATUS_VALUES = ["all", "upcoming", "starting-soon", "in-progress"] as const;
const PAST_STATUS_VALUES = ["all", "completed", "cancelled"] as const;
const ALL_STATUS_VALUES = ["all", "upcoming", "starting-soon", "in-progress", "completed", "cancelled"] as const;
const SORTS = ["asc", "desc"] as const;
const ALL_SORTS = ["first", "desc", "asc"] as const;
/** In the one list, where each status sits under "Upcoming first". */
const GROUP_ORDER: Record<WalkStatus, number> = {
  "in-progress": 0,
  "starting-soon": 0,
  upcoming: 0,
  completed: 1,
  cancelled: 2,
};

export function AdminWalkTable(props: {
  attendanceLabel?: string;
  emptyDescription: string;
  emptyTitle: string;
  scope: "upcoming" | "past" | "all";
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
  /** Which status choices make sense for this tab ("all": every walk in one list, no tabs). */
  scope: "upcoming" | "past" | "all";
  walks: AdminWalkRow[];
}) {
  const [query, setQuery] = useQueryText(scope === "past" ? "pq" : "q");
  const [statusFilter, setStatusFilter] = useQueryChoice(
    scope === "past" ? "pstatus" : "status",
    scope === "all" ? ALL_STATUS_VALUES : scope === "upcoming" ? UPCOMING_STATUS_VALUES : PAST_STATUS_VALUES,
    "all",
  );
  const [sortOrder, setSortOrder] = useQueryChoice(
    scope === "past" ? "psort" : "sort",
    scope === "all" ? ALL_SORTS : SORTS,
    scope === "all" ? "first" : scope === "past" ? "desc" : "asc",
  );
  const listRef = useRef<HTMLDivElement>(null);
  /** No matches: the search and status back to everything. */
  const clearFilters = () => {
    void setQuery("");
    void setStatusFilter("all");
  };
  const allStatusOptions =
    scope === "all" ? ALL_STATUS_OPTIONS : scope === "upcoming" ? UPCOMING_STATUS_OPTIONS : PAST_STATUS_OPTIONS;
  const now = useLiveNow();
  const router = useRouter();
  const design = useSiteDesign();

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

    const statusOf = (walk: AdminWalkRow) =>
      walkStatus(
        {
          cancelledAt: walk.cancelledAt ? new Date(walk.cancelledAt) : null,
          startsAt: new Date(walk.startsAt),
          durationMins: walk.durationMins,
          endedAt: walk.endedAt ? new Date(walk.endedAt) : null,
        },
        now,
      );
    rows.sort((a, b) => {
      const delta = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      if (sortOrder === "first") {
        const group = GROUP_ORDER[statusOf(a)] - GROUP_ORDER[statusOf(b)];
        if (group !== 0) return group;
        // Coming up: soonest first; completed and cancelled: latest first.
        return GROUP_ORDER[statusOf(a)] === 0 ? delta : -delta;
      }
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

  // The shadcn.io design: the list as one table card (search, Filter, Columns, Show,
  // grouped rows and Previous / Next).
  if (design === "shadcnio") {
    const rows: WalkTableRow[] = filtered.map((walk) => {
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
      return {
        id: walk.id,
        title: walk.title,
        location: walk.location,
        startsAt: walk.startsAt,
        durationMins: walk.durationMins,
        endedAt: walk.endedAt,
        cancelledAt: walk.cancelledAt,
        // A walk still to come shows no count until someone's clocked in.
        count:
          (scope === "upcoming" || (scope === "all" && GROUP_ORDER[status] === 0)) && walk.attendanceCount === 0
            ? null
            : walk.attendanceCount,
        cue:
          scope !== "past" && canClockIn ? (walk.selfClockedIn ? "You're clocked in" : "Clock in now") : null,
        href: walk.href === undefined ? `/admin/walks/${walk.id}` : walk.href,
      };
    });
    return (
      <div ref={listRef}>
        <WalkTableCard
          countLabel={attendanceLabel}
          empty={
            query.trim() || statusFilter !== "all" ? (
              <EmptyState
                action={<ClearFiltersButton onClick={clearFilters} />}
                description="Try a different search, status, or sort."
                icon={Search}
                title="No matching walks"
              />
            ) : (
              <EmptyState
                description={upcomingNeedsServerSplit ? "Moving finished walks to History…" : emptyDescription}
                icon={Footprints}
                title={upcomingNeedsServerSplit ? "Updating upcoming walks…" : emptyTitle}
              />
            )
          }
          onQuery={setQuery}
          onSort={(value) => setSortOrder(value)}
          onStatus={(value) => setStatusFilter(value)}
          query={query}
          rows={rows}
          searchLabel={scope === "all" ? "Search walks" : scope === "past" ? "Search past walks" : "Search upcoming walks"}
          sort={sortOrder}
          sortOptions={
            scope === "all"
              ? [
                  { value: "first", label: "Upcoming first" },
                  { value: "desc", label: "Latest first" },
                  { value: "asc", label: "Oldest first" },
                ]
              : [
                  { value: "asc", label: "Soonest first" },
                  { value: "desc", label: "Latest first" },
                ]
          }
          status={statusFilter}
          statusOptions={statusOptions}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end" data-edge-bar="">
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
            action={<ClearFiltersButton onClick={clearFilters} />}
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
              const href = walk.href === undefined ? `/admin/walks/${walk.id}` : walk.href;
              return (
              <DataListItem
                className={cn("relative flex-col items-stretch gap-0 p-0", !href && "opacity-70")}
                data-stagger-item=""
                key={walk.id}
              >
                {/* Status and day as the card's header strip (see WalkStatusHeader). */}
                <WalkStatusHeader
                  cancelledAt={walk.cancelledAt}
                  durationMins={walk.durationMins}
                  endedAt={walk.endedAt}
                  startsAt={walk.startsAt}
                />
                <DataListItemMain className="items-center p-3">
                  <DataListBody>
                    <p className={cn("font-medium", !href && "text-muted-foreground")}>
                      {href ? (
                        // Fetches this walk's page on hover or touch, not every row on screen.
                        <IntentLink className="after:absolute after:inset-0" full href={href}>
                          {walk.title}
                        </IntentLink>
                      ) : (
                        walk.title
                      )}
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
                  {href ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" /> : null}
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
