import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden rounded-xl border">
          {/* The card's status header strip. */}
          <div className="h-7 border-b bg-muted/60" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
