import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shaped like the finished map card (walk-map.tsx): the same header, map
 * height, button row and small print, so nothing moves when it arrives.
 * Without a location (a whole-page placeholder) the place is a grey bar.
 */
export function WalkMapSkeleton({ location }: { location?: string }) {
  return (
    <Card className="gap-4 overflow-hidden py-0">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-base">Meeting point</CardTitle>
        {location ? (
          <CardDescription>{location}</CardDescription>
        ) : (
          <div className="flex h-5 items-center">
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
        )}
      </CardHeader>
      {/* The map is h-64 inside a border-y. */}
      <Skeleton className="h-[258px] w-full rounded-none" />
      <div className="flex flex-col gap-3 px-6 pb-6">
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Skeleton className="h-8 sm:w-32" />
          <Skeleton className="h-8 sm:w-28" />
        </div>
        {/* The small print under the buttons: two lines on a phone. */}
        <div className="flex flex-col">
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
          <div className="flex h-4 items-center sm:hidden">
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    </Card>
  );
}
