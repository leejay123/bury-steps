import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WalkMapSkeleton } from "@/components/walk-map-skeleton";

/**
 * Shaped like the organiser's walk page (page.tsx) — the back link, then
 * the title card with "Created by", its status label, fact tiles and
 * description, the share link and the meeting point — so the real page
 * drops into the same places instead of jumping.
 */
export default function Loading() {
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/walks">
        &larr; All walks
      </Link>

      <Card className="gap-4">
        <CardHeader>
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <div className="flex w-full min-w-0 items-center justify-between gap-4">
              <Skeleton className="h-6 w-2/3 max-w-sm" />
              <Skeleton className="h-6 w-28 rounded-md max-sm:hidden" />
            </div>
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-1 h-7 w-full rounded-md sm:hidden" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Same line heights as walk-facts.tsx, tile for tile. */}
          <div className="@container flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3 @3xl:grid-cols-4">
              {Array.from({ length: 9 }, (_, i) => (
                <div className="flex flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2.5" key={i}>
                  <div className="flex h-4 items-center">
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-4 w-24" />
                    </div>
                    {/* The meeting point wraps onto a second line in two columns. */}
                    {i === 3 ? (
                      <div className="flex h-5 items-center @lg:hidden">
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-1.5">
                <Skeleton className="h-6.5 w-32 rounded-full" />
                <Skeleton className="h-6.5 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>

      {/* The share link wraps onto two lines on a phone, with its Copy
          button full width under it (share-link.tsx). */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-12 min-w-0 sm:h-8 sm:flex-1" />
        <span aria-hidden className="invisible h-8 w-full sm:w-26 sm:shrink-0" />
      </div>

      <WalkMapSkeleton />
    </div>
  );
}
