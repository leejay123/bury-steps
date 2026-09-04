import { Skeleton } from "@/components/ui/skeleton";
import { DelayedReveal } from "@/components/delayed-reveal";

export default function Loading() {
  return (
    <DelayedReveal>
      <article
        aria-busy="true"
        aria-label="Loading notice"
        className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 md:px-6"
      >
        <Skeleton className="h-4 w-28" />
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-9 w-full max-w-md md:h-10" />
          <Skeleton className="h-5 w-full max-w-lg" />
          <Skeleton className="h-5 w-2/3 max-w-md" />
        </header>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </article>
    </DelayedReveal>
  );
}
