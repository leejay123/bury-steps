import { Suspense } from "react";
import { ensureWalkPoint } from "@/lib/walk-coordinates";
import { WalkMap } from "@/components/walk-map";
import { WalkMapSkeleton } from "@/components/walk-map-skeleton";

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
    <Suspense fallback={<WalkMapSkeleton location={location} />}>
      <WalkMapResolved location={location} walk={walk} />
    </Suspense>
  );
}
