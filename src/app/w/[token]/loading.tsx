import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WalkMapSkeleton } from "@/components/walk-map-skeleton";

/**
 * Shaped like the walk page itself (walk-share-status.tsx and walk-facts.tsx)
 * — the back link and journey button, then the title card with its status
 * bar, fact tiles, description and calendar button — so the real page drops
 * into the same places instead of pushing everything down.
 */
export default function Loading() {
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-32" />
      </div>

      <Card className="gap-4">
        <CardHeader>
          <div className="flex w-full min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <Skeleton className="h-5 w-2/3 max-w-sm" />
            <Skeleton className="h-6 w-full rounded-md sm:w-32" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="@container">
            <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3 @3xl:grid-cols-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-3 py-2.5" key={i}>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>

      <WalkMapSkeleton />
    </div>
  );
}
