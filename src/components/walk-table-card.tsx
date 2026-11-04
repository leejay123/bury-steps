"use client";

import { useState, type ReactNode } from "react";
import {
  Check,
  ChevronRight,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { WalkStatusHeader } from "@/components/walk-status-badge";
import { IntentLink } from "@/components/intent-link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTime } from "@/lib/dates";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { SkLine } from "@/components/list-skeletons";
import { RememberedRows } from "@/components/remembered-rows";
import { EDGE_FILTER, EdgeFilters, EdgeSearch } from "@/components/edge-search";
import { cn } from "@/lib/utils";

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

const PAGE_SIZES = [10, 20, 50] as const;
// The toolbar's buttons: outline, the site's corners.
const TOOL =
  "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0";
// One choice in the Filter menu: grey only under the pointer; the chosen one has a tick.
const CHOICE =
  "flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted aria-pressed:font-medium [&>svg]:invisible aria-pressed:[&>svg]:visible";

/**
 * The Walks list as one card (the shadcn.io design): search, Filter (status and sort)
 * and Show along the top; each walk with its status strip, as before; "Showing 1–10 of
 * 13 walks" and Previous / Next at the foot. The search, status and sort are the list's own (kept in the address), so
 * links and the back button keep them.
 */
export function WalkTableCard<S extends string, O extends string>({
  rows,
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

  const filtersOn =
    (status !== statusOptions[0]?.value ? 1 : 0) +
    (sort !== sortOptions[0]?.value ? 1 : 0);

  return (
    <div
      className="overflow-hidden rounded-xl border bg-background"
      data-walk-table=""
    >
      {/* Edge to edge (design D, as History): the search fills the strip, Filter and Show 10
          split off by a line; on phones they take a row under the search, half each. */}
      <div className="flex flex-wrap items-stretch border-b">
        <EdgeSearch label={searchLabel} onChange={onQuery} placeholder="Search by walk or meeting point…" stack value={query} />
        <EdgeFilters stack>
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(TOOL, EDGE_FILTER, "sm:px-4")} type="button">
              <SlidersHorizontal aria-hidden />
              Filter
              {filtersOn ? (
                <span className="rounded-full bg-foreground px-1.5 text-background text-xs tabular-nums">
                  {filtersOn}
                </span>
              ) : null}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-60 p-2">
            <p className="px-2 pt-1 pb-1.5 font-medium text-muted-foreground text-xs">
              Status
            </p>
            <div className="flex flex-col gap-0.5">
              {statusOptions.map((option) => (
                <button
                  aria-pressed={status === option.value}
                  className={CHOICE}
                  key={option.value}
                  onClick={() => onStatus(option.value)}
                  type="button"
                >
                  {option.label}
                  <Check aria-hidden className="size-4" />
                </button>
              ))}
            </div>
            <p className="mt-2 border-t px-2 pt-2.5 pb-1.5 font-medium text-muted-foreground text-xs">
              Sort
            </p>
            <div className="flex flex-col gap-0.5">
              {sortOptions.map((option) => (
                <button
                  aria-pressed={sort === option.value}
                  className={CHOICE}
                  key={option.value}
                  onClick={() => onSort(option.value)}
                  type="button"
                >
                  {option.label}
                  <Check aria-hidden className="size-4" />
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Select
          onValueChange={(value) => setPageSize(Number(value))}
          value={String(pageSize)}
        >
          <SelectTrigger
            aria-label="Walks per page"
            className={`${EDGE_FILTER} w-auto gap-2 sm:px-4`}
          >
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
        </EdgeFilters>
      </div>

      {rows.length === 0 ? (
        <div className="p-6">{empty}</div>
      ) : (
        <>
          {/* Each walk as before: its status and day on a grey strip, then its details. */}
          <ul className="divide-y">
            {paged.map((row) => (
              <li
                className={cn(
                  "relative",
                  row.href && "hover:bg-muted/40",
                  !row.href && "opacity-70",
                )}
                key={row.id}
              >
                <WalkStatusHeader
                  cancelledAt={row.cancelledAt}
                  durationMins={row.durationMins}
                  endedAt={row.endedAt}
                  startsAt={row.startsAt}
                />
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p
                      className={cn(
                        "font-medium",
                        !row.href && "text-muted-foreground",
                      )}
                    >
                      {row.href ? (
                        <IntentLink
                          className="after:absolute after:inset-0"
                          full
                          href={row.href}
                        >
                          {row.title}
                        </IntentLink>
                      ) : (
                        row.title
                      )}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formatTime(new Date(row.startsAt))}
                      {row.location ? ` · ${row.location}` : ""}
                    </p>
                    {row.count === null ? null : (
                      <p className="text-muted-foreground text-xs">
                        {row.count} {countLabel.toLowerCase()}
                      </p>
                    )}
                    {row.cue ? (
                      <p className="font-medium text-sm">{row.cue}</p>
                    ) : null}
                  </div>
                  {row.href ? (
                    <ChevronRight
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          {paged.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground text-sm">
              <SearchX aria-hidden className="size-5" />
              No matching {noun}. Try a different search or filter.
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-muted-foreground text-sm">
            <span className="tabular-nums">
              Showing {start + 1}–{Math.min(start + pageSize, rows.length)} of{" "}
              {rows.length} {noun}
            </span>
            <span className="flex gap-2">
              <button
                className={cn(
                  TOOL,
                  "h-8 disabled:pointer-events-none disabled:opacity-50",
                )}
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className={cn(
                  TOOL,
                  "h-8 disabled:pointer-events-none disabled:opacity-50",
                )}
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

/**
 * The table's placeholder, part for part: the same box and toolbar (search,
 * Filter, Show 10), each row's grey strip and details as grey lines, and the
 * Previous/Next row, as many rows as the list showed last time, so the
 * table drops in without anything moving.
 */
/**
 * Grey bars over invisible words: the words keep the line breaks and height of the real
 * text, the grey follows each line's own length (it never covers empty space).
 */
function GreyWords({ text }: { text: string }) {
  return (
    <span className="animate-pulse rounded-md bg-accent text-transparent [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
      {text}
    </span>
  );
}

export function WalkTableCardSkeleton({
  remember,
  lines = [],
}: {
  remember: string;
  /** The next walks' names and time lines (upcoming-walk-lines.ts): each row's grey sits over
   * them, so a long name wraps to two lines just as it will (rows past them: plain grey lines). */
  lines?: { title: string; detail: string }[];
}) {
  return (
    <div aria-busy="true" className="overflow-hidden rounded-xl border bg-background" data-walk-table="">
      <div className="flex flex-wrap items-stretch border-b">
        <EdgeSearch label="Search walks" placeholder="Search by walk or meeting point…" readOnly stack />
        <EdgeFilters stack>
        <span className={cn(TOOL, EDGE_FILTER, "sm:px-4")}>
          <SlidersHorizontal aria-hidden />
          Filter
        </span>
        <Select value="10">
          <SelectTrigger aria-label="Walks per page" className={`${EDGE_FILTER} w-auto gap-2 sm:px-4`} tabIndex={-1}>
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
        </EdgeFilters>
      </div>
      <RememberedRows
        as="ul"
        className="divide-y"
        // The table shows ten a page to start (Show 10).
        max={PAGE_SIZES[0]}
        remember={remember}
        rowAs="li"
        rows={Array.from({ length: LIST_PAGE_SIZE }, (_, i) => (
          <div key={i}>
            <div className="flex items-center justify-between gap-3 border-b bg-muted/50 px-3 py-2.5">
              <SkLine className="w-24" size="xs" />
              <SkLine className="w-16" size="xs" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              {lines[i] ? (
                // The real row's two lines (font-medium, then text-sm), in grey.
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="font-medium">
                    <GreyWords text={lines[i].title} />
                  </p>
                  <p className="text-sm">
                    <GreyWords text={lines[i].detail} />
                  </p>
                </div>
              ) : (
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <SkLine className={i % 2 ? "w-64" : "w-80"} />
                  <SkLine className={i % 3 ? "w-48" : "w-36"} size="sm" />
                </div>
              )}
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </div>
          </div>
        ))}
      />
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-muted-foreground text-sm">
        <SkLine className="w-40" size="sm" />
        <span className="flex gap-2">
          <span className={cn(TOOL, "h-8 opacity-50")}>Previous</span>
          <span className={cn(TOOL, "h-8 opacity-50")}>Next</span>
        </span>
      </div>
    </div>
  );
}
