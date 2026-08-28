"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { formatCompactDateTime, formatDate, formatTime, londonYear } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Footprints } from "lucide-react";

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
  href?: string;
};

export function AttendanceHistory({
  rows,
}: {
  rows: AttendanceHistoryRow[];
}) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const hay = `${row.title} ${row.location ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [query, rows]);

  const paging = usePagedList(filtered, { resetKey: query });

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
      <InputGroup className="max-w-md">
        <InputGroupInput
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by walk or meeting point…"
          value={query}
        />
        <InputGroupAddon>
          <Search data-icon="inline-start" />
        </InputGroupAddon>
      </InputGroup>

      {filtered.length === 0 ? (
        <EmptyState
          description="Try a different name or meeting point."
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
