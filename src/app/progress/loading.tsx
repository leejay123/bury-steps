import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-24 w-full rounded-xl border" />
      <Skeleton className="h-40 w-full rounded-xl border" />
    </div>
  );
}
