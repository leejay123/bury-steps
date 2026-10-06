import type { ReactNode } from "react";
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

export function SkChevron({ className }: { className?: string }) {
  return <Skeleton className={cn("size-4 shrink-0 rounded-[4px]", className)} />;
}

/** The list box itself — same frame as DataList. */
export function SkList({
  rows = 0,
  row,
  className,
}: {
  rows?: number;
  row: (index: number) => ReactNode;
  className?: string;
}) {
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

const TITLE_WIDTHS = ["w-40", "w-32", "w-48", "w-36", "w-44", "w-28"];
const DETAIL_WIDTHS = ["w-28", "w-36", "w-24", "w-32", "w-40", "w-28"];
const pick = (list: string[], i: number) => list[i % list.length];

/** Organiser Walks list: grey status strip, then name, time · place, count. */
export function WalkRowsSkeleton({ rows = 0 }: { rows?: number }) {
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
      rows={rows}
    />
  );
}

/** Notices list: category, title + arrow, date, a couple of lines of text. */
export function NoticeRowsSkeleton({ rows = 0 }: { rows?: number }) {
  if (rows < 1) return null;
  return (
    <div aria-busy="true" className="flex flex-col divide-y rounded-xl border" data-reveal-list="">
      {Array.from({ length: rows }, (_, i) => (
        <div className="flex flex-col gap-2 p-4" key={i}>
          <SkLine className="w-16" size="xs" />
          <div className="flex items-start justify-between gap-3">
            <SkLine className={pick(TITLE_WIDTHS, i)} />
            <SkChevron className="mt-1" />
          </div>
          <SkLine className="w-24" size="xs" />
          <SkLine className="w-full" size="sm" />
        </div>
      ))}
    </div>
  );
}

/** Messages: name, email line, then one preview — as tall as that preview, never a second invented line. */
export function MessageRowsSkeleton({ rows = 0, lines }: { rows?: number; lines?: string[] | null }) {
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
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </div>
      )}
      rows={rows}
    />
  );
}

/** Accident reports: day, walk, then one line of the write-up (it can grow to three, never the other way). */
export function ReportRowsSkeleton({ rows = 0 }: { rows?: number }) {
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
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </div>
      )}
      rows={rows}
    />
  );
}

/** Walk history: walk name + arrow, then two grey detail lines. */
export function HistoryRowsSkeleton({ rows = 0 }: { rows?: number }) {
  if (rows < 1) return null;
  return (
    <div aria-busy="true" className="flex flex-col divide-y rounded-xl border" data-reveal-list="">
      {Array.from({ length: rows }, (_, i) => (
        <div className="flex flex-col gap-2 p-4" key={i}>
          <div className="flex items-start justify-between gap-3">
            <SkLine className={pick(TITLE_WIDTHS, i)} />
            <SkChevron className="mt-1" />
          </div>
          <SkLine className={pick(DETAIL_WIDTHS, i)} size="sm" />
          <SkLine className="w-24" size="sm" />
        </div>
      ))}
    </div>
  );
}

/** Progress board: one name line per row, in a vertical list. */
export function NameRowsSkeleton({ rows = 0 }: { rows?: number }) {
  return (
    <SkList
      row={(i) => (
        <div className="flex items-center gap-3 p-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <SkLine className={pick(TITLE_WIDTHS, i)} />
        </div>
      )}
      rows={rows}
    />
  );
}
