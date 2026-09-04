import { Skeleton } from "@/components/ui/skeleton";
import { DelayedReveal } from "@/components/delayed-reveal";

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-1 border-b p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <Skeleton className="h-8 w-12" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export default function Loading() {
  return (
    <DelayedReveal>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>

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
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </section>

        {/* Together */}
        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-2 w-full rounded-full" />
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
      </div>
    </DelayedReveal>
  );
}
