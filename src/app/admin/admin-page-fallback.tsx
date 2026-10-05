import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * What an organiser page shows in the instant before its data arrives: the
 * page's real title (it never changes) and a list-shaped placeholder —
 * the same frame and padding as the page itself, so nothing jumps.
 */
export function AdminPageFallback({
  title,
  rows = 5,
  list,
}: {
  title?: string;
  rows?: number;
  /** The page's own row placeholder (list-skeletons.tsx), so it matches the
   * real rows exactly instead of generic ones. */
  list?: ReactNode;
}) {
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-1.5">
        {title ? (
          <h1 className="font-semibold text-lg tracking-tight">{title}</h1>
        ) : (
          <Skeleton className="h-6 w-48" />
        )}
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      {list ?? (
        <ul className="flex flex-col overflow-hidden rounded-xl border bg-card">
          {Array.from({ length: rows }, (_, i) => (
            <li className="flex items-center gap-3 border-b p-3 last:border-0" key={i}>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
