import Link from "next/link";
import { HistoryFilterChrome } from "@/components/list-chrome";
import { FIRST_VISIT_ROWS, HistoryRowsSkeleton } from "@/components/list-skeletons";

/** The page's real heading, search and filters, then rows shaped like the
 * history list. Headings and descriptions are never grey: where one goes,
 * an empty line of the same height keeps the list from jumping. The row
 * count (remembered from last time) is read inside the page. */
export function HistoryLoading({ rows }: { rows: number | null }) {
  const count = rows ?? FIRST_VISIT_ROWS;
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
        <div aria-hidden className="h-5" />
      </div>
      {count === 0 ? null : (
        <div className="flex flex-col gap-6">
          <HistoryFilterChrome />
          <section className="flex flex-col gap-3">
            <div aria-hidden className="h-5" />
            <HistoryRowsSkeleton rows={count} />
          </section>
        </div>
      )}
    </div>
  );
}

export default function Loading() {
  return <HistoryLoading rows={null} />;
}
