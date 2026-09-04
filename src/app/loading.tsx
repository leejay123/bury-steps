import { Skeleton } from "@/components/ui/skeleton";
import { DelayedReveal } from "@/components/delayed-reveal";

export default function Loading() {
  return (
    <DelayedReveal>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="aspect-[2/1] w-full rounded-lg" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div className="flex flex-col gap-2 rounded-lg border p-4" key={i}>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DelayedReveal>
  );
}
