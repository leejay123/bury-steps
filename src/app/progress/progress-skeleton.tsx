"use client";

import type { ReactNode } from "react";
import { NameRowsSkeleton, SkLine } from "@/components/list-skeletons";
import { RememberedRows } from "@/components/remembered-rows";
import { RememberedText } from "@/components/remembered-text";
import { Skeleton } from "@/components/ui/skeleton";
import { CUP_BODY_COOKIE, CUP_TITLE_COOKIE, TOGETHER_BODY_COOKIE } from "@/lib/remembered-rows-key";

/** Same cell as the loaded stat: the number is the only part still loading. */
function StatSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1 border-b p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <SkLine className="w-8" size="lg" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Grey behind invisible copy, line by line: each wrapped line's grey stops
 * where its words stop (box-decoration-break: clone), so the box is the
 * real height and the short last line is short — no grey block. */
function GreyWords({ words }: { words: ReactNode }) {
  return (
    <span className="animate-pulse rounded-[4px] bg-accent [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">
      {words}
    </span>
  );
}

/**
 * Progress while it loads: the stats card, then the badges, Together and
 * cup cards and the name rows exactly as they were last time (saved in the
 * browser), all on the very first paint — one placeholder, the right size,
 * on a refresh and on a page change alike (RememberedRows / RememberedText).
 * Headings and descriptions are the real thing.
 */
export function ProgressSkeleton() {
  return (
    <>
      <section className="overflow-hidden rounded-xl border" data-reveal-card="">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          <StatSkeleton label="This month" />
          <StatSkeleton label="This year" />
          <StatSkeleton label="Weeks in a row" />
        </div>
      </section>

      {/* Hidden with its heading when there were no badges last time. */}
      <section className="flex flex-col gap-3 has-[>[hidden]]:hidden" data-reveal-card="">
        <h2 className="text-sm font-medium text-muted-foreground">Your badges</h2>
        <RememberedRows
          className="flex flex-wrap gap-2"
          max={12}
          remember="progress-badges"
          rows={Array.from({ length: 12 }, (_, i) => (
            <Skeleton className="h-5 w-16 rounded-md" key={i} />
          ))}
        />
      </section>

      <RememberedText className="flex flex-col gap-3 rounded-xl border p-4" name={TOGETHER_BODY_COOKIE}>
        {(words) => (
          <>
            <h2 className="font-medium">Together</h2>
            <p className="text-sm">
              <GreyWords words={words} />
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <Skeleton className="h-full w-1/2 rounded-full" />
            </div>
          </>
        )}
      </RememberedText>

      <RememberedText className="flex flex-col gap-1.5 rounded-xl border p-4" max={40} name={CUP_TITLE_COOKIE}>
        {(title) => (
          <>
            {/* The heading ("October cup") is shown for real. */}
            <h2 className="font-medium [&_[data-sk-words]]:visible">{title}</h2>
            <RememberedText name={CUP_BODY_COOKIE}>
              {(body) => (
                <p className="text-sm">
                  <GreyWords words={body} />
                </p>
              )}
            </RememberedText>
          </>
        )}
      </RememberedText>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">This month</h2>
          <p className="text-sm text-muted-foreground">
            Everyone who has clocked in to a finished walk this month, grouped by how many. People
            with the same count sit together — a draw, not a place. People with none are not listed.
          </p>
        </div>
        <NameRowsSkeleton remember="progress" />
      </section>
    </>
  );
}
