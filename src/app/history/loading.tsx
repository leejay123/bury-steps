import { HistoryFilterChrome } from "@/components/list-chrome";
import { HistoryRowsSkeleton, SkLine } from "@/components/list-skeletons";

/** The page's real heading, description, search and filters, then rows
 * shaped like the history list. The count line and year heading depend on
 * your walks, so they're grey lines (never an empty gap). The row
 * count (remembered from last time) is read inside the page. */
export function HistoryLoading() {
  return (
    <div data-page-loading="" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-lg font-semibold tracking-tight">Your walk history</h1>
        <p className="text-sm text-muted-foreground">
          Every walk you clock in to will be kept here, once it&apos;s finished.
        </p>
        {/* "You have clocked in to 12 walks." — depends on your walks; not
            there when the list was empty last time. */}
        <div className="[[data-page-loading]:has([data-reveal-list][hidden])_&]:hidden">
          <SkLine className="w-56" size="sm" />
        </div>
      </div>
      {/* As many rows as last time, from the first paint; with none last
          time the list hides itself, and the filters with it. */}
      <div className="flex flex-col gap-6 [&:has([data-reveal-list][hidden])>[data-sk-filters]]:hidden">
        <div className="contents" data-sk-filters="">
          <HistoryFilterChrome />
        </div>
        <section className="flex flex-col gap-3">
          {/* The year heading. */}
          <div className="[section:has([data-reveal-list][hidden])>&]:hidden">
            <SkLine className="w-12" size="sm" />
          </div>
          <HistoryRowsSkeleton remember="history" />
        </section>
      </div>
    </div>
  );
}

export default function Loading() {
  return <HistoryLoading />;
}
