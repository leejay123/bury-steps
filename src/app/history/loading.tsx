import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryRowsSkeleton, SkFilters } from "@/components/list-skeletons";

/** The page's real heading, then the same frame as the list below it —
 * search and the two labelled filters, a year heading, rows — so the
 * history drops into place instead of jumping down. */
export default function Loading() {
  return (
    <div data-page-loading="" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">
          <Link className="hover:underline" href="/walks">
            Walks
          </Link>
          <span aria-hidden="true"> · </span>
          History
        </p>
        <h1 className="text-lg font-semibold tracking-tight">Your walk history</h1>
        <Skeleton className="my-0.5 h-4 w-56" />
      </div>
      <div className="flex flex-col gap-6">
        <SkFilters />
        <section className="flex flex-col gap-3">
          <Skeleton className="my-0.5 h-4 w-28" />
          <HistoryRowsSkeleton />
        </section>
      </div>
    </div>
  );
}
