"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatDate, formatDateTime, formatTime, londonYear } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  layout = "table",
  rows,
}: {
  layout?: "table" | "list";
  rows: AttendanceHistoryRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const hay = `${row.title} ${row.location ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [query, rows]);

  const years = useMemo(() => {
    const grouped = new Map<number, AttendanceHistoryRow[]>();
    for (const row of filtered) {
      const year = londonYear(new Date(row.startsAt));
      const list = grouped.get(year) ?? [];
      list.push(row);
      grouped.set(year, list);
    }
    return [...grouped.entries()].sort((a, b) => b[0] - a[0]);
  }, [filtered]);

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
    <div className="flex flex-col gap-6">
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
        years.map(([year, yearRows]) => (
          <section className="flex flex-col gap-3" key={year}>
            <h2 className="text-sm font-medium text-muted-foreground">
              {year} · {yearRows.length} {yearRows.length === 1 ? "walk" : "walks"}
            </h2>
            {layout === "list" ? (
              <HistoryList rows={yearRows} />
            ) : (
              <HistoryTable rows={yearRows} />
            )}
          </section>
        ))
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
          <div className="flex flex-col gap-2 p-4" key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {row.href ? (
                  <Link className="hover:underline" href={row.href}>
                    {row.title}
                  </Link>
                ) : (
                  row.title
                )}
              </p>
              {row.cancelledAt ? <Badge variant="destructive">Cancelled</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(startsAt)} · {formatTime(startsAt)} · {row.durationMins} min
              {row.location ? ` · ${row.location}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              In {formatDateTime(new Date(row.clockedInAt))}
              {row.clockedOutAt
                ? ` · Out ${formatDateTime(new Date(row.clockedOutAt))}`
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

function HistoryTable({ rows }: { rows: AttendanceHistoryRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Walk</TableHead>
          <TableHead className="hidden sm:table-cell">Meeting point</TableHead>
          <TableHead>Clocked in</TableHead>
          <TableHead>Clocked out</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const startsAt = new Date(row.startsAt);
          return (
            <TableRow key={row.id}>
              <TableCell>
                <p className="font-medium">
                  {row.href ? (
                    <Link className="hover:underline" href={row.href}>
                      {row.title}
                    </Link>
                  ) : (
                    row.title
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(startsAt)} · {formatTime(startsAt)} · {row.durationMins} min
                </p>
                {row.cancelledAt ? (
                  <Badge className="mt-1.5" variant="destructive">
                    Cancelled
                  </Badge>
                ) : null}
                {row.clockedOutReason ? (
                  <p className="mt-1 text-xs text-muted-foreground">{row.clockedOutReason}</p>
                ) : null}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {row.location || "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(new Date(row.clockedInAt))}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {row.clockedOutAt
                  ? formatDateTime(new Date(row.clockedOutAt))
                  : "Still on the walk"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
