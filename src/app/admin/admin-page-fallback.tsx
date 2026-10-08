import type { ReactNode } from "react";

/**
 * What an organiser page shows in the instant before its data arrives: the
 * page's real title, and the real search and filters when those are passed
 * in. The list itself waits until the rows are ready.
 */
export function AdminPageFallback({
  title,
  description,
  filters,
  rows: _rows = 0,
  list: _list,
}: {
  title?: string;
  description?: string;
  filters?: ReactNode;
  rows?: number;
  list?: ReactNode;
}) {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
      {title || description ? (
        <div className="flex flex-col gap-1.5">
          {title ? <h1 className="font-semibold text-lg tracking-tight">{title}</h1> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {filters}
    </div>
  );
}
