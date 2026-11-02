import { HistoryFilterChrome } from "@/components/list-chrome";
import { HistoryRowsSkeleton, SkLine } from "@/components/list-skeletons";
import { PageTop } from "@/components/page-top";

const HISTORY_INTRO = "Every walk you clock in to will be kept here, once it's finished.";

/** "You have clocked in to 12 walks." while it loads: a grey line, gone when the list was empty last time. */
export function HistoryCountFallback() {
  return (
    <div className="[[data-history-page]:has([data-reveal-list][hidden])_&]:hidden">
      <SkLine className="w-56" size="sm" />
    </div>
  );
}

/** The list while it loads: the real search and filters, then rows shaped like the history list, as many as last time. */
export function HistoryListFallback() {
  return (
    // With no rows last time the list hides itself, and the filters with it.
    <div
      aria-busy="true"
      className="flex flex-col gap-6 [&:has([data-reveal-list][hidden])>[data-sk-filters]]:hidden"
      data-page-loading=""
    >
      <div className="contents" data-sk-filters="">
        <HistoryFilterChrome />
      </div>
      <section className="flex flex-col gap-3">
        <HistoryRowsSkeleton remember="history" />
      </section>
    </div>
  );
}

/** The whole page while it loads (the route's loading state): the real heading, then the parts above. */
export function HistoryLoading() {
  return (
    <div className="flex flex-col gap-6" data-history-page="">
      <PageTop eyebrow="Dashboard" intro={HISTORY_INTRO} title="Your walk history">
        <HistoryCountFallback />
      </PageTop>
      <HistoryListFallback />
    </div>
  );
}

export default function Loading() {
  return <HistoryLoading />;
}
