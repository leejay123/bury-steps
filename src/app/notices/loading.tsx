import { Skeleton } from "@/components/ui/skeleton";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { DelayedReveal } from "@/components/delayed-reveal";

export default function Loading() {
  return (
    <DelayedReveal>
      <div className={`relative -mt-6 -mb-6 ${PAGE_X_BLEED}`}>
        <section className="flex flex-col gap-0" aria-busy="true" aria-label="Loading notices">
          <div className="flex flex-col gap-3 px-4 py-6 md:px-6">
            <Skeleton className="h-8 w-36 md:h-9" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-2/3 max-w-sm" />
            <Skeleton className="h-9 w-full max-w-md" />
          </div>

          <div className="flex gap-2 border-y px-4 py-1 md:px-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton className="h-10 w-20 shrink-0" key={i} />
            ))}
          </div>

          <div className="px-4 py-6 md:px-6">
            <div className="flex flex-col divide-y rounded-xl border">
              {[0, 1, 2, 3].map((i) => (
                <div className="flex flex-col gap-2 p-4" key={i}>
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-5 w-2/3 max-w-xs" />
                    <Skeleton className="size-4 shrink-0" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DelayedReveal>
  );
}
