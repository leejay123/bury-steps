import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4 px-4 py-6 md:px-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
        {[0, 1, 2, 3].map((i) => (
          <div className="flex flex-col gap-2 p-3" key={i}>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
