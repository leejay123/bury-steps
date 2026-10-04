import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * What an organiser page shows in the instant before its data arrives: the
 * page's real title (it never changes) and, when a list is loading, only
 * that list's rows. Search boxes and filters are passed in as the real
 * controls — they are not drawn as grey bars.
 */
export function AdminPageFallback({
  title,
  description,
  filters,
  rows = 0,
  list,
}: {
  title?: string;
  description?: string;
  filters?: ReactNode;
  rows?: number;
  /** The page's own row placeholder (list-skeletons.tsx), so it matches the
   * real rows exactly instead of generic ones. */
  list?: ReactNode;
}) {
  return (
    <div aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
      {title || description ? (
        <div className="flex flex-col gap-1.5">
          {title ? <h2 className="font-semibold text-lg tracking-tight">{title}</h2> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {filters}
      {list ??
        (rows > 0 ? (
          <ul className="flex flex-col overflow-hidden rounded-xl border bg-card" data-reveal-list="">
            {Array.from({ length: rows }, (_, i) => (
              <li className="flex items-center gap-3 border-b p-3 last:border-0" key={i}>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : null)}
    </div>
  );
}
