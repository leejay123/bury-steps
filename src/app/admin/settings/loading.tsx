import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="relative border-b px-4 py-6 md:px-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="px-4 py-6 md:px-6">
        <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div className="flex flex-col gap-1.5 p-3" key={i}>
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
