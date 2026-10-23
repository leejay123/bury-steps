import { SkLine } from "@/components/list-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { loadDailyForecast, loadForecastPlaceName } from "@/lib/weather-forecast";
import { forecastWindow, londonDateKey } from "@/lib/weather";
import { formatWalkDay } from "@/lib/dates";
import { walkStatus } from "@/lib/walk-window";
import { CloudOff, CloudSun, MapPin, Sun } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { WalkForecastCard } from "@/components/walk-forecast-card";

/**
 * The whole forecast card while the weather loads, shaped like
 * WalkForecastCard: the real title and place, the seven day cells, the
 * selected day's details and the hourly row — grey only where the
 * weather goes — so the card doesn't grow into place when it arrives.
 */
export function ForecastSkeleton({ place }: { place: string | null }) {
  return (
    <Card aria-busy="true" className="gap-0 overflow-hidden py-0" data-reveal-card="">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sun aria-hidden className="size-4" />
          7-day forecast
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin aria-hidden className="size-4 shrink-0" />
          {place ? <span className="truncate">{place}</span> : <SkLine className="w-32" size="sm" />}
        </div>
      </div>
      <div aria-hidden className="grid grid-cols-7 border-y">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            className="flex min-w-0 flex-col items-center gap-1.5 border-r px-0.5 py-3 text-center last:border-r-0 sm:gap-2 sm:py-4"
            key={i}
          >
            <div className="flex h-4 items-center sm:h-5">
              <Skeleton className="h-[64%] w-8 rounded-lg" />
            </div>
            <div className="flex h-[1.0625rem] items-center sm:h-4">
              <Skeleton className="h-[64%] w-7 rounded-lg" />
            </div>
            <Skeleton className="size-5 rounded-full" />
            <div className="flex h-4 items-center sm:h-5">
              <Skeleton className="h-[64%] w-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden className="flex flex-col gap-3 px-4 py-4 sm:px-5">
        <div className="flex h-9 items-center">
          <Skeleton className="h-[64%] w-24 rounded-lg" />
        </div>
        <SkLine className="w-72 max-w-full" size="sm" />
        <SkLine className="w-56 max-w-full" size="sm" />
        <div className="-mx-1 flex gap-2 overflow-hidden px-1 pt-1 pb-1">
          {Array.from({ length: 16 }, (_, i) => (
            <div className="flex w-14 shrink-0 flex-col items-center gap-1 rounded-md border bg-background px-1 py-2" key={i}>
              <Skeleton className="h-3 w-8 rounded-lg" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-3 w-5 rounded-lg" />
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">Weather data by Open-Meteo</span>
      </div>
    </Card>
  );
}

async function WalkForecastLoaded({
  latitude,
  longitude,
  place,
  startsAt,
}: {
  latitude: number;
  longitude: number;
  place: string;
  startsAt: Date;
}) {
  const walkDate = londonDateKey(startsAt);
  const [placeName, days] = await Promise.all([
    loadForecastPlaceName(latitude, longitude),
    loadDailyForecast(latitude, longitude),
  ]);
  const area = placeName || place;
  if (!days) {
    return (
      // The site's empty box, like an empty attendance list.
      <EmptyState
        description={`The forecast for ${area} couldn’t be loaded just now. Try again later.`}
        icon={CloudOff}
        title="Forecast unavailable"
      />
    );
  }

  const window = forecastWindow(days, walkDate);
  if (window.availableLater) {
    return (
      // The site's empty box, like an empty attendance list. Within the
      // forecast's 16 days, so the year never needs showing.
      <EmptyState
        description={`The forecast for ${area} on ${formatWalkDay(startsAt, startsAt)} appears here in the 16 days before the walk.`}
        icon={CloudSun}
        title="No forecast yet"
      />
    );
  }
  if (window.days.length === 0) {
    return (
      // The site's empty box, like an empty attendance list.
      <EmptyState
        description={`The forecast for ${area} couldn’t be loaded just now. Try again later.`}
        icon={CloudOff}
        title="Forecast unavailable"
      />
    );
  }

  return (
    <WalkForecastCard
      days={window.days}
      place={area}
      walkDate={window.walkDateInWindow ? walkDate : null}
    />
  );
}

/**
 * Seven-day forecast for the meeting point. Hidden once the walk is
 * completed or cancelled, and when there is no map pin. The marked day is
 * the walk's own date — a Wednesday walk marks Wednesday.
 */
export function WalkForecastSection({
  cancelledAt,
  durationMins,
  endedAt,
  latitude,
  longitude,
  place,
  startsAt,
  timeFree = false,
}: {
  cancelledAt: Date | null;
  durationMins: number;
  endedAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  place: string;
  startsAt: Date;
  /** The caller hides it once the walk has finished (in the browser), so
   * this doesn't read the clock — for a page made ahead of time. */
  timeFree?: boolean;
}) {
  if (cancelledAt) return null;
  if (!timeFree && walkStatus({ cancelledAt, durationMins, endedAt, startsAt }) === "completed") return null;
  if (latitude == null || longitude == null || !place) return null;

  return (
    <Suspense fallback={<ForecastSkeleton place={place} />}>
      <WalkForecastLoaded latitude={latitude} longitude={longitude} place={place} startsAt={startsAt} />
    </Suspense>
  );
}
