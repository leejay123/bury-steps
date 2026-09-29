import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            {/* The walk card's status header strip. */}
            <div className="h-7 border-b bg-muted/60" />
            <div className="p-3">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
