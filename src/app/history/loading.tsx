import { Skeleton } from "@/components/ui/skeleton";
import { DelayedReveal } from "@/components/delayed-reveal";

export default function Loading() {
  return (
    <DelayedReveal>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-full max-w-md" />
        <div className="overflow-hidden rounded-xl border">
          {[0, 1, 2, 3, 4].map((i) => (
            <div className="flex flex-col gap-2 border-b p-4 last:border-0" key={i}>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </DelayedReveal>
  );
}
