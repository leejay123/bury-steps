import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-48 max-w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
