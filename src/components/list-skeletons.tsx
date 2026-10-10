import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { RememberedRows } from "@/components/remembered-rows";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { Empty, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * One placeholder per list, shaped exactly like its real rows — used on a
 * refresh, a first visit and while a list loads, so a page never shows two
 * different placeholders depending on timing. The bars use the same sizes
 * the reveal draws over real content (content-reveal.tsx): each bar sits in
 * a box the height of the text line it stands for, and fills 64% of it.
 */

const LINE_HEIGHT = { xs: "h-4", sm: "h-5", base: "h-6", lg: "h-8" } as const;

/** One line of text: base = a row's bold title, sm = grey detail, xs = small print. */
export function SkLine({ size = "base", className }: { size?: keyof typeof LINE_HEIGHT; className?: string }) {
  return (
    <div className={cn("flex items-center", LINE_HEIGHT[size])}>
      <Skeleton className={cn("h-[64%] max-w-full rounded-[4px]", className)} />
    </div>
  );
}

/**
 * Grey bars laid over the real words. The words are invisible, so the box
 * wraps to the same height as the loaded text and is never taller.
 */
export function SkText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("relative block", className)}>
      <span className="invisible">{text}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-pulse"
        style={{
          backgroundImage: "linear-gradient(var(--accent), var(--accent))",
          backgroundRepeat: "repeat-y",
          backgroundSize: "64% calc(1lh * 0.64)",
          backgroundPosition: "left calc(1lh * 0.18)",
        }}
      />
    </span>
  );
}

/** The row's arrow: the real icon, as it looks when loaded (it isn't data). */
export function SkChevron({ className }: { className?: string }) {
  return <ChevronRight aria-hidden className={cn("size-4 shrink-0 text-muted-foreground", className)} />;
}

/** The list box itself — same frame as DataList. */
export function SkList({
  rows = 0,
  row,
  className,
  remember,
  empty,
}: {
  rows?: number;
  row: (index: number) => ReactNode;
  className?: string;
  /** The list's RememberListCount key: draws as many rows as last time, from the first paint. */
  remember?: string;
  /** Shown when the list was empty last time (EmptyStateSkeleton). */
  empty?: ReactNode;
}) {
  if (remember) {
    return (
      <RememberedRows
        empty={empty}
        as="ul"
        className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", className)}
        remember={remember}
        rowAs="li"
        rowClassName="border-b last:border-0 [&:has(+[hidden])]:border-0"
        rows={Array.from({ length: LIST_PAGE_SIZE }, (_, i) => row(i))}
      />
    );
  }
  if (rows < 1) return null;
  return (
    <ul
      aria-busy="true"
      className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", className)}
      data-reveal-list=""
    >
      {Array.from({ length: rows }, (_, i) => (
        <li className="border-b last:border-0" key={i}>
          {row(i)}
        </li>
      ))}
    </ul>
  );
}

export { FIRST_VISIT_ROWS } from "@/lib/list-page-size";

/** Where a row has a button: a grey shape the button's size (no empty gaps while loading). */
export function SkButtonSpace({ className }: { className?: string }) {
  return <Skeleton aria-hidden className={cn("block h-7 rounded-md", className)} />;
}

const TITLE_WIDTHS = ["w-40", "w-32", "w-48", "w-36", "w-44", "w-28"];
const DETAIL_WIDTHS = ["w-28", "w-36", "w-24", "w-32", "w-40", "w-28"];
const pick = (list: string[], i: number) => list[i % list.length];

/** Organiser Walks list: grey status strip, then name, time · place, count. */
export function WalkRowsSkeleton({ rows = 0, remember }: { rows?: number; remember?: string }) {
  return (
    <SkList
      row={(i) => (
        <>
          <div className="flex items-center justify-between gap-3 border-b bg-muted/50 px-3 py-1.5">
            <SkLine className="w-28" size="xs" />
            <SkLine className="w-16" size="xs" />
          </div>
          <div className="flex items-center gap-2 p-3">
            <div className="min-w-0 flex-1">
              <SkLine className={pick(TITLE_WIDTHS, i)} />
              <SkLine className={pick(DETAIL_WIDTHS, i)} size="sm" />
              <SkLine className="w-20" size="xs" />
            </div>
            <SkChevron />
          </div>
        </>
      )}
      remember={remember}
      rows={rows}
    />
  );
}

/** Notices list: category, title + arrow, date, a couple of lines of text. */
function NoticeRow({ i }: { i: number }) {
  return (
    <>
      <SkLine className="w-16" size="xs" />
      <div className="flex items-start justify-between gap-3">
        <SkLine className={pick(TITLE_WIDTHS, i)} />
        <SkChevron className="mt-1" />
      </div>
      <SkLine className="w-24" size="xs" />
      <SkLine className="w-full" size="sm" />
    </>
  );
}

export function NoticeRowsSkeleton({ rows = 0, remember }: { rows?: number; remember?: string }) {
  if (remember) {
    return (
      <RememberedRows
        className="flex flex-col divide-y rounded-xl border"
        remember={remember}
        rowClassName="flex flex-col gap-2 p-4"
        rows={Array.from({ length: LIST_PAGE_SIZE }, (_, i) => (
          <NoticeRow i={i} key={i} />
        ))}
      />
    );
  }
  if (rows < 1) return null;
  return (
    <div aria-busy="true" className="flex flex-col divide-y rounded-xl border" data-reveal-list="">
      {Array.from({ length: rows }, (_, i) => (
        <div className="flex flex-col gap-2 p-4" key={i}>
          <NoticeRow i={i} />
        </div>
      ))}
    </div>
  );
}

/** Messages: name, email line, then one preview — as tall as that preview, never a second invented line. */
export function MessageRowsSkeleton({
  rows = 0,
  lines,
  remember,
}: {
  rows?: number;
  lines?: string[] | null;
  remember?: string;
}) {
  return (
    <SkList
      row={(i) => (
        <div className="flex flex-col items-stretch gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <SkLine className={pick(TITLE_WIDTHS, i)} />
            <SkLine className={pick(DETAIL_WIDTHS, i)} size="sm" />
            <div className="mt-1 text-sm">
              {lines?.[i] ? <SkText text={lines[i]} /> : <SkLine className="w-full max-w-lg" size="sm" />}
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-1 border-t pt-2 sm:border-0 sm:pt-0">
            <SkButtonSpace className="w-16" />
          </div>
        </div>
      )}
      empty={<EmptyStateSkeleton lines={2} />}
      remember={remember}
      rows={rows}
    />
  );
}

/** Accident reports: day, walk, then one line of the write-up (it can grow to three, never the other way). */
export function ReportRowsSkeleton({ rows = 0, remember }: { rows?: number; remember?: string }) {
  return (
    <SkList
      row={(i) => (
        <div className="flex flex-col items-stretch gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <SkLine className={pick(TITLE_WIDTHS, i)} />
            <SkLine className={pick(DETAIL_WIDTHS, i)} size="sm" />
            <SkLine className="w-full max-w-lg" size="sm" />
          </div>
          <div className="flex shrink-0 justify-end gap-1 border-t pt-2 sm:border-0 sm:pt-0">
            <SkButtonSpace className="w-16" />
          </div>
        </div>
      )}
      empty={<EmptyStateSkeleton lines={2} />}
      remember={remember}
      rows={rows}
    />
  );
}

/** Walk history: walk name + arrow, then two grey detail lines. */
function HistoryRow({ i }: { i: number }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <SkLine className={pick(TITLE_WIDTHS, i)} />
        <SkChevron className="mt-1" />
      </div>
      <SkLine className={pick(DETAIL_WIDTHS, i)} size="sm" />
      <SkLine className="w-24" size="sm" />
    </>
  );
}

export function HistoryRowsSkeleton({ rows = 0, remember }: { rows?: number; remember?: string }) {
  if (remember) {
    return (
      <RememberedRows
        empty={<EmptyStateSkeleton />}
        className="flex flex-col divide-y rounded-xl border"
        remember={remember}
        rowClassName="flex flex-col gap-2 p-4"
        rows={Array.from({ length: LIST_PAGE_SIZE }, (_, i) => (
          <HistoryRow i={i} key={i} />
        ))}
      />
    );
  }
  if (rows < 1) return null;
  return (
    <div aria-busy="true" className="flex flex-col divide-y rounded-xl border" data-reveal-list="">
      {Array.from({ length: rows }, (_, i) => (
        <div className="flex flex-col gap-2 p-4" key={i}>
          <HistoryRow i={i} />
        </div>
      ))}
    </div>
  );
}

/** Progress board: one name line per row, in a vertical list. */
export function NameRowsSkeleton({ rows = 0, remember }: { rows?: number; remember?: string }) {
  return (
    <SkList
      row={(i) => (
        <div className="flex items-center gap-3 p-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <SkLine className={pick(TITLE_WIDTHS, i)} />
        </div>
      )}
      remember={remember}
      rows={rows}
    />
  );
}

/**
 * Organiser Members list: the group strip (Owner / Organisers / Members, left
 * empty — it's a heading), then a row per member shaped like the real one:
 * photo circle, name, email, joined · clock-ins, arrow, and the empty space
 * where the row's actions button sits (members-table.tsx).
 */
function MemberRow({ i }: { i: number }) {
  return (
    <>
      <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <SkLine className={pick(TITLE_WIDTHS, i)} />
          <SkLine className={pick(DETAIL_WIDTHS, i)} size="sm" />
          <SkLine className="w-40" size="xs" />
        </div>
        <SkChevron className="mt-1 sm:mt-0" />
      </div>
      <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-end gap-2 border-t pt-2 sm:border-0 sm:pt-0">
        <SkButtonSpace className="w-7" />
      </div>
    </>
  );
}

/**
 * Organiser Members list: the group strip (Owner / Organisers / Members, left
 * empty — it's a heading), then a row per member shaped like the real one:
 * photo circle, name, email, joined · clock-ins, arrow, and the empty space
 * where the row's actions button sits (members-table.tsx). As many rows as
 * last time, from the first paint.
 */
export function MemberRowsSkeleton({ remember = "members" }: { remember?: string }) {
  return (
    <RememberedRows
      as="ul"
      className="flex flex-col overflow-hidden rounded-xl border bg-card"
      leading={
        <li
          aria-hidden="true"
          className="flex items-baseline gap-1.5 border-b bg-muted/50 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
        >
          <span className="invisible">Members</span>
        </li>
      }
      remember={remember}
      rowAs="li"
      rowClassName="relative flex flex-col items-stretch gap-2 border-b p-3 last:border-0 [&:has(+[hidden])]:border-0 sm:flex-row sm:items-center sm:gap-3"
      rows={Array.from({ length: LIST_PAGE_SIZE }, (_, i) => (
        <MemberRow i={i} key={i} />
      ))}
    />
  );
}

/**
 * The empty box (EmptyState: "No messages yet", "When you clock in, those
 * walks will show here."…) as a placeholder, for a list that was empty last
 * time: same frame and size, grey where the icon, title and sentence go.
 * Not the message itself — it may not be empty any more.
 */
/** `lines`: how many lines the real empty box's sentence wraps to (max-w-sm). */
export function EmptyStateSkeleton({ lines = 1 }: { lines?: 1 | 2 }) {
  return (
    <Empty aria-hidden className="w-full min-h-64 border bg-muted/30">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Skeleton className="size-6 rounded-md" />
        </EmptyMedia>
        <div className="flex h-7 items-center">
          <Skeleton className="h-[64%] w-44 rounded-[4px]" />
        </div>
        {/* text-sm/relaxed: 0.875rem × 1.625 per line. */}
        <div className="flex w-full flex-col items-center">
          <div className="flex h-[1.421875rem] w-full items-center justify-center">
            <Skeleton className={cn("h-[54%] max-w-full rounded-[4px]", lines === 2 ? "w-80" : "w-64")} />
          </div>
          {lines === 2 ? (
            <div className="flex h-[1.421875rem] w-full items-center justify-center">
              <Skeleton className="h-[54%] w-48 max-w-full rounded-[4px]" />
            </div>
          ) : null}
        </div>
      </EmptyHeader>
    </Empty>
  );
}
