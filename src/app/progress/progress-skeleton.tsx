import { Skeleton } from "@/components/ui/skeleton";

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-1 border-b p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <Skeleton className="h-8 w-12" />
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

/** Same shape as the stats, badges, monthly cup and This month sections.
 * The Together card only shows once an organiser sets a group goal (off by
 * default), so it isn't drawn here — a placeholder for a card that then
 * doesn't come made everything below jump up. */
export function ProgressSkeleton() {
  return (
    <>

      {/* Mirrors the This month/This year/Weeks stat row. */}
      <section className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      </section>

      {/* Badges */}
      <section className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-[22px] w-24 rounded-md" />
          <Skeleton className="h-[22px] w-32 rounded-md" />
        </div>
      </section>

      {/* Monthly cup */}
      <section className="flex flex-col gap-1.5 rounded-xl border p-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </section>

      {/* This month's board */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
          {[0, 1, 2].map((i) => (
            <div className="p-3" key={i}>
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
