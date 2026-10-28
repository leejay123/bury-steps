import { Skeleton } from "@/components/ui/skeleton";

/** The dashboards' shape while the figures load: four figures, a wide chart and two panels. */
export function DashboardSkeleton() {
  return (
    <div aria-hidden className="grid grid-cols-1 gap-4 py-6 md:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div className="flex flex-col gap-3 rounded-xl border p-6" key={i}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
      <div className="flex flex-col gap-4 rounded-xl border p-6 md:col-span-2 lg:col-span-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-56 w-full" />
      </div>
      {[0, 1].map((i) => (
        <div className="flex flex-col gap-3 rounded-xl border p-6 md:col-span-2" key={i}>
          <Skeleton className="h-4 w-32" />
          {[0, 1, 2, 3].map((row) => (
            <Skeleton className="h-8 w-full" key={row} />
          ))}
        </div>
      ))}
    </div>
  );
}
