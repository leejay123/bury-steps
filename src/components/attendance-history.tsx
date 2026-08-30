"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Footprints, Search } from "lucide-react";
import { formatCompactDateTime, formatDate, formatTime, londonYear } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AttendanceHistoryRow = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  durationMins: number;
  cancelledAt: string | null;
  clockedInAt: string;
  clockedOutAt: string | null;
  clockedOutReason?: string | null;
  /** True once the walk's own clock-in window has fully closed. */
  completed?: boolean;
  href?: string;
};

type StatusFilter = "all" | "full" | "left-early" | "cancelled";

function matchesStatus(row: AttendanceHistoryRow, status: StatusFilter): boolean {
  if (status === "all") return true;
  if (status === "cancelled") return Boolean(row.cancelledAt);
  if (status === "left-early") return Boolean(row.clockedOutAt) && !row.cancelledAt;
  // full: finished (or still recorded as stayed) without leaving early, and not cancelled
  return !row.cancelledAt && !row.clockedOutAt;
}

export function AttendanceHistory({
  rows,
}: {
  rows: AttendanceHistoryRow[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const listRef = useRef<HTMLDivElement>(null);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const row of rows) years.add(londonYear(new Date(row.startsAt)));
    return [...years].sort((a, b) => b - a);
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesStatus(row, status)) return false;
      if (yearFilter !== "all" && londonYear(new Date(row.startsAt)) !== Number(yearFilter)) {
        return false;
      }
      if (!needle) return true;
      const hay = `${row.title} ${row.location ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [query, rows, status, yearFilter]);

  const resetKey = `${query}|${status}|${yearFilter}`;
  const paging = usePagedList(filtered, { resetKey });

  const years = useMemo(() => {
    const grouped = new Map<number, AttendanceHistoryRow[]>();
    for (const row of paging.paged) {
      const year = londonYear(new Date(row.startsAt));
      const list = grouped.get(year) ?? [];
      list.push(row);
      grouped.set(year, list);
    }
    return [...grouped.entries()].sort((a, b) => b[0] - a[0]);
  }, [paging.paged]);

  if (rows.length === 0) {
    return (
      <EmptyState
        description="When you clock in, those walks will show here."
        icon={Footprints}
        title="No walks yet"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6" ref={listRef}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <InputGroup className="w-full min-w-0 sm:min-w-[16rem] sm:flex-1">
          <InputGroupInput
            aria-label="Search your walk history"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by walk or meeting point…"
            value={query}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Label htmlFor="history-status-filter">Status</Label>
          <Select onValueChange={(value) => setStatus(value as StatusFilter)} value={status}>
            <SelectTrigger className="w-full sm:w-[11rem]" id="history-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="full">Stayed for walk</SelectItem>
              <SelectItem value="left-early">Left early</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {availableYears.length > 1 ? (
          <div className="flex shrink-0 flex-col gap-1.5">
            <Label htmlFor="history-year-filter">Year</Label>
            <Select onValueChange={setYearFilter} value={yearFilter}>
              <SelectTrigger className="w-full sm:w-[8.5rem]" id="history-year-filter">
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
          description="Try a different search or filter."
          icon={Search}
          title="No matching walks"
        />
      ) : (
        <>
          {years.map(([year, yearRows]) => (
            <section className="flex flex-col gap-3" key={year}>
              <h2 className="text-sm font-medium text-muted-foreground">
                {year} · {yearRows.length} {yearRows.length === 1 ? "walk" : "walks"}
              </h2>
              <HistoryList rows={yearRows} />
            </section>
          ))}
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

function HistoryList({ rows }: { rows: AttendanceHistoryRow[] }) {
  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {rows.map((row) => {
        const startsAt = new Date(row.startsAt);
        return (
          <div className={cn("relative flex flex-col gap-2 p-4", row.href && "hover:bg-muted/50")} key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {row.href ? (
                  <Link className="after:absolute after:inset-0" href={row.href}>
                    {row.title}
                  </Link>
                ) : (
                  row.title
                )}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                {row.cancelledAt ? <Badge variant="destructive">Cancelled</Badge> : null}
                {row.href ? <ChevronRight className="size-4 text-muted-foreground" /> : null}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(startsAt)} · {formatTime(startsAt)} · {row.durationMins} min
              {row.location ? ` · ${row.location}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              In {formatCompactDateTime(new Date(row.clockedInAt))}
              {row.clockedOutAt
                ? ` · Out ${formatCompactDateTime(new Date(row.clockedOutAt))}`
                : row.completed
                  ? " · Stayed for the whole walk"
                  : " · Still on the walk"}
            </p>
            {row.clockedOutReason ? (
              <p className="text-sm text-muted-foreground">{row.clockedOutReason}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
