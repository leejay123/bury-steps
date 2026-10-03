import { Skeleton } from "@/components/ui/skeleton";
import { HistoryRowsSkeleton } from "@/components/list-skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-full max-w-md" />
      <HistoryRowsSkeleton />
    </div>
  );
}
