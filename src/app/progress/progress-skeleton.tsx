import { NameRowsSkeleton, SkLine } from "@/components/list-skeletons";

/** Same cell as the loaded stat: the number is the only part still loading. */
function StatSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1 border-b p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <SkLine className="w-8" size="lg" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * The stats card is on screen immediately, at the same size as the loaded
 * card, so the page does not jump. Grey stands in for the numbers only.
 * The name list uses the same frame as the loaded list.
 */
export function ProgressSkeleton({ rows }: { rows: number }) {
  return (
    <>
      <section className="overflow-hidden rounded-xl border" data-reveal-card="">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          <StatSkeleton label="This month" />
          <StatSkeleton label="This year" />
          <StatSkeleton label="Weeks in a row" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-medium">This month</h2>
          <p className="text-sm text-muted-foreground">
            Everyone who has clocked in to a finished walk this month, grouped by how many. People
            with the same count sit together — a draw, not a place. People with none are not listed.
          </p>
        </div>
        <NameRowsSkeleton rows={rows} />
      </section>
    </>
  );
}
