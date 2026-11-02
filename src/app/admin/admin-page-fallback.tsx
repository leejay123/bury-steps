import { AdminPageIntro } from "./admin-page-intro";
import type { ReactNode } from "react";

/**
 * What an organiser page shows in the instant before its data arrives: the
 * page's real title, the real search and filters when those are passed in,
 * and the page's own list placeholder (list-skeletons.tsx) when it has one.
 * Pages that aren't lists (the Guide, a member's page) show no grey shapes.
 */
export function AdminPageFallback({
  title,
  description,
  filters,
  rows: _rows = 0,
  list,
  action,
}: {
  title?: string;
  description?: string;
  filters?: ReactNode;
  rows?: number;
  /** The page's own row placeholder (list-skeletons.tsx), shaped like its real rows. */
  list?: ReactNode;
  /** The page top's button, when the page has one (same size, so the title doesn't move). */
  action?: ReactNode;
}) {
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
      {/* The same page top as the page (its animated band in the dashboard), so nothing moves when it arrives. */}
      {title ? <AdminPageIntro action={action} description={description ?? ""} title={title} /> : null}
      {/* When the list was empty last time, its rows hide themselves and the
          empty box's shape shows instead (RememberedRows); the filters hide
          too, as on the real empty page. */}
      <div className="flex flex-col gap-6 [&:has([data-reveal-list][hidden])>[data-sk-filters]]:hidden">
        {filters ? (
          <div className="contents" data-sk-filters="">
            {filters}
          </div>
        ) : null}
        {list}
      </div>
    </div>
  );
}
