import { Suspense } from "react";
import { ensureWalkPoint } from "@/lib/walk-coordinates";
import { WalkMap } from "@/components/walk-map";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function WalkMapFallback({ location }: { location: string }) {
  return (
    <Card className="gap-4 overflow-hidden py-0">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-base">Meeting point</CardTitle>
        <CardDescription>{location}</CardDescription>
      </CardHeader>
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="flex flex-wrap gap-2 px-6 pb-6">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
    </Card>
  );
}

async function WalkMapResolved({
  location,
  walk,
}: {
  location: string;
  walk: {
    id: string;
    location: string | null;
    postcode?: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}) {
  const point = await ensureWalkPoint(walk);
  return <WalkMap location={location} point={point} />;
}

/** Map + optional geocode stream in after the rest of the walk page. */
export function WalkMapSection({
  location,
  walk,
}: {
  location: string;
  walk: {
    id: string;
    location: string | null;
    postcode?: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}) {
  return (
    <Suspense fallback={<WalkMapFallback location={location} />}>
      <WalkMapResolved location={location} walk={walk} />
    </Suspense>
  );
}
