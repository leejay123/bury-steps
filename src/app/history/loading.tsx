import { HistoryFilterChrome } from "@/components/list-chrome";
import { HistoryRowsSkeleton } from "@/components/list-skeletons";

/** Static shell. The row count is read inside the page, after this placeholder. */
export function HistoryLoading({ rows }: { rows: number | null }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">
          Walks
          <span aria-hidden="true"> · </span>
          History
        </p>
        <h1 className="text-lg font-semibold tracking-tight">Your walk history</h1>
      </div>
      {rows === 0 ? null : <HistoryFilterChrome />}
      <HistoryRowsSkeleton rows={rows ?? 0} />
    </div>
  );
}

export default function Loading() {
  return <HistoryLoading rows={null} />;
}
