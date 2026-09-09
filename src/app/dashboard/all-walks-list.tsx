"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Footprints, Search } from "lucide-react";
import { formatDate, formatTime, londonYear } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AllWalksRow = {
  id: string;
  href: string;
  title: string;
  location: string | null;
  startsAt: string;
  durationMins: number;
  attendanceCount: number;
};

/**
 * Every completed walk site-wide — title/date/location and a headcount
 * only. Opening a walk shows who attended it if, and only if, the viewer
 * was on that walk themselves (WalkLivePanel's existing privacy rule) —
 * this list never shows names itself.
 */
export function AllWalksList({ rows }: { rows: AllWalksRow[] }) {
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const listRef = useRef<HTMLDivElement>(null);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const row of rows) years.add(londonYear(new Date(row.startsAt)));
    return [...years].sort((a, b) => b - a);
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (yearFilter !== "all" && londonYear(new Date(row.startsAt)) !== Number(yearFilter)) {
        return false;
      }
      if (!needle) return true;
      const hay = `${row.title} ${row.location ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [query, rows, yearFilter]);

  const paging = usePagedList(filtered, { resetKey: `${query}|${yearFilter}` });

  if (rows.length === 0) {
    return (
      <EmptyState
        description="Completed walks will show here once there are some."
        icon={Footprints}
        title="No completed walks yet"
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
        <EmptyState description="Try a different search or year." icon={Search} title="No matching walks" />
      ) : (
        <>
          <div className="flex flex-col divide-y rounded-xl border">
            {paging.paged.map((row) => {
              const startsAt = new Date(row.startsAt);
              return (
                <div className="relative flex flex-col gap-2 p-4 hover:bg-muted/50" key={row.id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      <Link className="after:absolute after:inset-0" href={row.href}>
                        {row.title}
                      </Link>
                    </p>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(startsAt)} · {formatTime(startsAt)} · {row.durationMins} min
                    {row.location ? ` · ${row.location}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {row.attendanceCount === 1
                      ? "1 person attended"
                      : `${row.attendanceCount} people attended`}
                  </p>
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
