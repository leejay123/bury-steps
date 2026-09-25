"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Footprints, Search } from "lucide-react";
import { formatDate, formatTime, londonYear } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { ListPagination } from "@/components/list-pagination";
import { WalkStatusBadge } from "@/components/walk-status-badge";
import { usePagedList } from "@/hooks/use-paged-list";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AllWalksRow = {
  id: string;
  /** Absent for a cancelled walk when the viewer isn't an organiser with
   * Walks access — see viewerCanOpenCancelledWalk in page.tsx. Renders as
   * a greyed-out, unclickable row instead of a link. */
  href?: string;
  title: string;
  location: string | null;
  startsAt: string;
  durationMins: number;
  /** Set once an organiser ends the walk early — see endWalkEarly. */
  endedAt: string | null;
  cancelledAt: string | null;
  attendanceCount: number;
};

type StatusFilter = "all" | "completed" | "cancelled";

/**
 * Every completed or cancelled walk site-wide — title/date/location and a
 * headcount only. Opening a walk shows who attended it if, and only if,
 * the viewer was on that walk themselves (WalkLivePanel's existing privacy
 * rule) — this list never shows names itself.
 */
export function AllWalksList({ rows }: { rows: AllWalksRow[] }) {
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const listRef = useRef<HTMLDivElement>(null);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const row of rows) years.add(londonYear(new Date(row.startsAt)));
    return [...years].sort((a, b) => b - a);
  }, [rows]);

  // Only offer "Completed"/"Cancelled" when a row actually has that status.
  const hasCompleted = useMemo(() => rows.some((row) => !row.cancelledAt), [rows]);
  const hasCancelled = useMemo(() => rows.some((row) => row.cancelledAt), [rows]);

  useEffect(() => {
    if (statusFilter === "completed" && !hasCompleted) setStatusFilter("all");
    if (statusFilter === "cancelled" && !hasCancelled) setStatusFilter("all");
  }, [statusFilter, hasCompleted, hasCancelled]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter === "completed" && row.cancelledAt) return false;
      if (statusFilter === "cancelled" && !row.cancelledAt) return false;
      if (yearFilter !== "all" && londonYear(new Date(row.startsAt)) !== Number(yearFilter)) {
        return false;
      }
      if (!needle) return true;
      const hay = `${row.title} ${row.location ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [query, rows, statusFilter, yearFilter]);

  const paging = usePagedList(filtered, { resetKey: `${query}|${yearFilter}|${statusFilter}` });

  if (rows.length === 0) {
    return (
      <EmptyState
        description="Completed and cancelled walks will show here once there are some."
        icon={Footprints}
        title="No walks yet"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <InputGroup className="w-full min-w-0 sm:flex-1">
          <InputGroupInput
            aria-label="Search all walks"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by walk or meeting point…"
            value={query}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Label htmlFor="all-walks-status-filter">Status</Label>
          <Select onValueChange={(value) => setStatusFilter(value as StatusFilter)} value={statusFilter}>
            <SelectTrigger className="w-full sm:w-[9.5rem]" id="all-walks-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {hasCompleted ? <SelectItem value="completed">Completed</SelectItem> : null}
              {hasCancelled ? <SelectItem value="cancelled">Cancelled</SelectItem> : null}
            </SelectContent>
          </Select>
        </div>
        {availableYears.length > 1 ? (
          <div className="flex shrink-0 flex-col gap-1.5">
            <Label htmlFor="all-walks-year-filter">Year</Label>
            <Select onValueChange={setYearFilter} value={yearFilter}>
              <SelectTrigger className="w-full sm:w-[8.5rem]" id="all-walks-year-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          description="Try a different search, status, or year."
          icon={Search}
          title="No matching walks"
        />
      ) : (
        <>
          <div className="flex flex-col divide-y rounded-xl border">
            {paging.paged.map((row) => {
              const startsAt = new Date(row.startsAt);
              return (
                <div
                  className={cn(
                    "relative flex flex-col gap-2 p-4",
                    row.href ? "hover:bg-muted/50" : "opacity-70",
                  )}
                  key={row.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={cn("font-medium", !row.href && "text-muted-foreground")}>
                      {row.href ? (
                        <Link className="after:absolute after:inset-0" href={row.href}>
                          {row.title}
                        </Link>
                      ) : (
                        row.title
                      )}
                    </p>
                    <div className="relative z-10 flex shrink-0 items-center gap-2">
                      <WalkStatusBadge
                        cancelledAt={row.cancelledAt}
                        durationMins={row.durationMins}
                        endedAt={row.endedAt}
                        startsAt={row.startsAt}
                      />
                      {row.href ? (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(startsAt)} · {formatTime(startsAt)} · {row.durationMins} min
                    {row.location ? ` · ${row.location}` : ""}
                  </p>
                  {row.cancelledAt
                    ? row.attendanceCount > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {row.attendanceCount === 1
                            ? "1 person had clocked in before it was cancelled"
                            : `${row.attendanceCount} people had clocked in before it was cancelled`}
                        </p>
                      )
                    : (
                        <p className="text-sm text-muted-foreground">
                          {row.attendanceCount === 1
                            ? "1 person attended"
                            : `${row.attendanceCount} people attended`}
                        </p>
                      )}
                </div>
              );
            })}
          </div>
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
