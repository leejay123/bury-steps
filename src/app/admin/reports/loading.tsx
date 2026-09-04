import { Skeleton } from "@/components/ui/skeleton";
import { DelayedReveal } from "@/components/delayed-reveal";

export default function Loading() {
  return (
    <DelayedReveal>
      <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <div className="flex flex-col divide-y overflow-hidden rounded-xl border">
          {[0, 1, 2, 3].map((i) => (
            <div className="flex flex-col gap-2 p-3" key={i}>
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </DelayedReveal>
  );
}
