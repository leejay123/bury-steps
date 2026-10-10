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
}: {
  title?: string;
  description?: string;
  filters?: ReactNode;
  rows?: number;
  /** The page's own row placeholder (list-skeletons.tsx), shaped like its real rows. */
  list?: ReactNode;
}) {
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
      {title || description ? (
        <div className="flex flex-col gap-1.5">
          {title ? <h1 className="font-semibold text-lg tracking-tight">{title}</h1> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {filters}
      {list}
    </div>
  );
}
