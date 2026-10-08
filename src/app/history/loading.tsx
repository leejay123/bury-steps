import Link from "next/link";
import { HistoryFilterChrome } from "@/components/list-chrome";

/** The real heading and filters. The walks appear when they are ready. */
export function HistoryLoading({ rows }: { rows: number | null }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">
          <Link className="hover:underline" href="/walks">
            Walks
          </Link>
          <span aria-hidden="true"> · </span>
          History
        </p>
        <h1 className="text-lg font-semibold tracking-tight">Your walk history</h1>
      </div>
      {rows === 0 ? null : <HistoryFilterChrome />}
    </div>
  );
}

export default function Loading() {
  return <HistoryLoading rows={null} />;
}
