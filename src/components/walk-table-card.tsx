"use client";

import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronRight, Columns3, Search, SearchX, SlidersHorizontal } from "lucide-react";
import { IntentLink } from "@/components/intent-link";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTime, formatWalkDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { walkStatus, type WalkStatus } from "@/lib/walk-window";

/** One walk as the table shows it. */
export type WalkTableRow = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  durationMins: number;
  endedAt: string | null;
  cancelledAt: string | null;
  /** Walkers count (left off when null). */
  count: number | null;
  /** A short line under the title, e.g. "Clock in now". */
  cue?: string | null;
  /** Where the row goes; null makes it unclickable. */
  href: string | null;
};

type Option<T extends string> = { value: T; label: string };
type ColumnId = "location" | "time" | "count";

const GROUP_LABEL: Record<WalkStatus, string> = {
  upcoming: "Upcoming",
  "starting-soon": "Starting soon",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
const PAGE_SIZES = [10, 20, 50] as const;
const COLUMNS_KEY = "bs-walk-table-columns";
const COLUMNS_EVENT = "bs-walk-table-columns";
function readColumns() {
  try {
    return localStorage.getItem(COLUMNS_KEY) ?? "";
  } catch {
    return "";
  }
}
function subscribeColumns(onChange: () => void) {
  window.addEventListener(COLUMNS_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COLUMNS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// The toolbar's buttons: outline, the site's corners.
const TOOL =
  "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0";
const CHOICE =
  "flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted aria-pressed:bg-muted aria-pressed:font-medium";

/**
 * The Walks list as one table card (the shadcn.io design): search, Filter (status and
 * sort), Columns and Show along the top; column headings; the walks grouped under
 * their status with a count; "Showing 1–10 of 13 walks" and Previous / Next at the
 * foot. The search, status and sort are the list's own (kept in the address), so
 * links and the back button keep them.
 */
export function WalkTableCard<S extends string, O extends string>({
  rows,
  now,
  query,
  onQuery,
  searchLabel,
  status,
  statusOptions,
  onStatus,
  sort,
  sortOptions,
  onSort,
  countLabel,
  noun = "walks",
  empty,
}: {
  rows: WalkTableRow[];
  now: Date;
  query: string;
  onQuery: (value: string) => void;
  searchLabel: string;
  status: S;
  statusOptions: Option<S>[];
  onStatus: (value: S) => void;
  sort: O;
  sortOptions: Option<O>[];
  onSort: (value: O) => void;
  /** The Walkers column's heading. */
  countLabel: string;
  noun?: string;
  /** Shown in the card's body when there's nothing to list. */
  empty: ReactNode;
}) {
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  // The columns someone chose stay chosen on this device (all shown until the page
  // knows, so the server's copy and the first paint match).
  const saved = useSyncExternalStore(subscribeColumns, readColumns, () => "");
  const columns = useMemo<Record<ColumnId, boolean>>(() => {
    const all = { location: true, time: true, count: true };
    try {
      return saved ? { ...all, ...JSON.parse(saved) } : all;
    } catch {
      return all;
    }
  }, [saved]);
  const toggleColumn = (id: ColumnId) => {
    try {
      localStorage.setItem(COLUMNS_KEY, JSON.stringify({ ...columns, [id]: !columns[id] }));
    } catch {}
    window.dispatchEvent(new Event(COLUMNS_EVENT));
  };

  // Back to the first page whenever what's listed changes.
  const listKey = `${query}|${status}|${sort}|${pageSize}|${rows.length}`;
  const [shownKey, setShownKey] = useState(listKey);
  if (shownKey !== listKey) {
    setShownKey(listKey);
    setPage(1);
  }
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  // The rows on this page, under a band for each run of the same status.
  const groups = useMemo(() => {
    const out: { status: WalkStatus; rows: WalkTableRow[] }[] = [];
    for (const row of paged) {
      const rowStatus = walkStatus(
        {
          cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : null,
          startsAt: new Date(row.startsAt),
          durationMins: row.durationMins,
          endedAt: row.endedAt ? new Date(row.endedAt) : null,
        },
        now,
      );
      const last = out[out.length - 1];
      if (last && last.status === rowStatus) last.rows.push(row);
      else out.push({ status: rowStatus, rows: [row] });
    }
    return out;
  }, [now, paged]);

  const filtersOn = (status !== statusOptions[0]?.value ? 1 : 0) + (sort !== sortOptions[0]?.value ? 1 : 0);
  const grid = [
    "minmax(0,2fr)",
    columns.location ? "minmax(0,1.4fr)" : null,
    columns.time ? "5.5rem" : null,
    columns.count ? "6.5rem" : null,
    "1.25rem",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="overflow-hidden rounded-xl border bg-background" data-walk-table="">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <InputGroup className="min-w-0 flex-1 basis-60">
          <InputGroupInput
            aria-label={searchLabel}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search by walk or meeting point…"
            value={query}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
        <Popover>
          <PopoverTrigger asChild>
            <button className={TOOL} type="button">
              <SlidersHorizontal aria-hidden />
              Filter
              {filtersOn ? (
                <span className="rounded-full bg-foreground px-1.5 text-background text-xs tabular-nums">{filtersOn}</span>
              ) : null}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-60 p-2">
            <p className="px-2 pt-1 pb-1.5 font-medium text-muted-foreground text-xs">Status</p>
            {statusOptions.map((option) => (
              <button
                aria-pressed={status === option.value}
                className={CHOICE}
                key={option.value}
                onClick={() => onStatus(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
            <p className="mt-2 border-t px-2 pt-2.5 pb-1.5 font-medium text-muted-foreground text-xs">Sort</p>
            {sortOptions.map((option) => (
              <button
                aria-pressed={sort === option.value}
                className={CHOICE}
                key={option.value}
                onClick={() => onSort(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(TOOL, "max-sm:hidden")} type="button">
              <Columns3 aria-hidden />
              Columns
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-52 p-2">
            {(
              [
                ["location", "Meeting point"],
                ["time", "Time"],
                ["count", countLabel],
              ] as [ColumnId, string][]
            ).map(([id, label]) => (
              <label className={cn(CHOICE, "cursor-pointer")} key={id}>
                {label}
                <input checked={columns[id]} className="size-4 accent-foreground" onChange={() => toggleColumn(id)} type="checkbox" />
              </label>
            ))}
          </PopoverContent>
        </Popover>
        <Select onValueChange={(value) => setPageSize(Number(value))} value={String(pageSize)}>
          <SelectTrigger aria-label="Walks per page" className="h-9 w-auto gap-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                Show {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <div className="p-6">{empty}</div>
      ) : (
        <>
          <div
            className="hidden items-center gap-4 border-b bg-muted/40 px-4 py-3 font-medium text-sm md:grid"
            role="presentation"
            style={{ gridTemplateColumns: grid }}
          >
            <span>Walk</span>
            {columns.location ? <span>Meeting point</span> : null}
            {columns.time ? <span>Time</span> : null}
            {columns.count ? <span className="text-right">{countLabel}</span> : null}
            <span />
          </div>
          <ul>
            {groups.map((group, g) => (
              <li key={`${group.status}-${g}`}>
                <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2.5 text-muted-foreground text-xs">
                  <span className="font-medium uppercase tracking-wide">{GROUP_LABEL[group.status]}</span>
                  <span className="tabular-nums">
                    {group.rows.length} {group.rows.length === 1 ? noun.replace(/s$/, "") : noun}
                  </span>
                </div>
                <ul>
                  {group.rows.map((row) => (
                    <li
                      className={cn(
                        "relative grid items-center gap-x-4 gap-y-1 border-b px-4 py-3.5 last:border-b-0 hover:bg-muted/40",
                        !row.href && "opacity-70 hover:bg-transparent",
                      )}
                      key={row.id}
                      style={{ gridTemplateColumns: "var(--walk-grid)", ["--walk-grid" as string]: grid }}
                    >
                      <div className="min-w-0 max-md:col-span-full">
                        <p className={cn("truncate font-medium", !row.href && "text-muted-foreground")}>
                          {row.href ? (
                            <IntentLink className="after:absolute after:inset-0" full href={row.href}>
                              {row.title}
                            </IntentLink>
                          ) : (
                            row.title
                          )}
                        </p>
                        <p className="truncate text-muted-foreground text-sm">
                          {formatWalkDay(row.startsAt)}
                          <span className="md:hidden">
                            {` · ${formatTime(new Date(row.startsAt))}`}
                            {row.location ? ` · ${row.location}` : ""}
                          </span>
                        </p>
                        {row.cue ? <p className="font-medium text-sm">{row.cue}</p> : null}
                      </div>
                      {columns.location ? (
                        <span className="truncate text-muted-foreground text-sm max-md:hidden">{row.location || "—"}</span>
                      ) : null}
                      {columns.time ? (
                        <span className="text-sm tabular-nums max-md:hidden">{formatTime(new Date(row.startsAt))}</span>
                      ) : null}
                      {columns.count ? (
                        <span className="text-right font-medium text-sm tabular-nums max-md:hidden">{row.count ?? "—"}</span>
                      ) : null}
                      <span className="flex justify-end max-md:absolute max-md:top-1/2 max-md:right-4 max-md:-translate-y-1/2">
                        {row.href ? <ChevronRight aria-hidden className="size-4 text-muted-foreground" /> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground text-sm">
              <SearchX aria-hidden className="size-5" />
              No matching {noun}. Try a different search or filter.
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-muted-foreground text-sm">
            <span className="tabular-nums">
              Showing {start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length} {noun}
            </span>
            <span className="flex gap-2">
              <button
                className={cn(TOOL, "h-8 disabled:pointer-events-none disabled:opacity-50")}
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className={cn(TOOL, "h-8 disabled:pointer-events-none disabled:opacity-50")}
                disabled={current >= pageCount}
                onClick={() => setPage(current + 1)}
                type="button"
              >
                Next
              </button>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
