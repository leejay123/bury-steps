import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-16" />
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-5">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border p-5">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-6 w-2/3" />
        </div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex flex-col gap-3 rounded-lg border p-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-64 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}
