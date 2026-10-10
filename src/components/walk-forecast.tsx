import { SkLine } from "@/components/list-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { loadDailyForecast, loadForecastPlaceName } from "@/lib/weather-forecast";
import { forecastWindow, londonDateKey } from "@/lib/weather";
import { formatWalkDay } from "@/lib/dates";
import { walkStatus } from "@/lib/walk-window";
import { MapPin, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalkForecastCard } from "@/components/walk-forecast-card";

function ForecastFrame({
  place,
  children,
}: {
  place: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-4">
      <CardHeader className="gap-1">
        <CardTitle className="text-base">7-day forecast</CardTitle>
        <CardDescription>{place}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

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
              <Skeleton className="h-[64%] w-8 rounded-[4px]" />
            </div>
            <div className="flex h-[1.0625rem] items-center sm:h-4">
              <Skeleton className="h-[64%] w-7 rounded-[4px]" />
            </div>
            <Skeleton className="size-5 rounded-full" />
            <div className="flex h-4 items-center sm:h-5">
              <Skeleton className="h-[64%] w-9 rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden className="flex flex-col gap-3 px-4 py-4 sm:px-5">
        <div className="flex h-9 items-center">
          <Skeleton className="h-[64%] w-24 rounded-[4px]" />
        </div>
        <SkLine className="w-72 max-w-full" size="sm" />
        <SkLine className="w-56 max-w-full" size="sm" />
        <div className="-mx-1 flex gap-2 overflow-hidden px-1 pt-1 pb-1">
          {Array.from({ length: 16 }, (_, i) => (
            <div className="flex w-14 shrink-0 flex-col items-center gap-1 rounded-md border bg-background px-1 py-2" key={i}>
              <Skeleton className="h-3 w-8 rounded-[4px]" />
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-3 w-5 rounded-[4px]" />
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
      <ForecastFrame place={area}>
        <p className="text-sm text-muted-foreground">The forecast couldn’t be loaded just now.</p>
      </ForecastFrame>
    );
  }

  const window = forecastWindow(days, walkDate);
  if (window.availableLater) {
    return (
      <ForecastFrame place={area}>
        <p className="text-sm text-muted-foreground">
          The forecast for {formatWalkDay(startsAt)} isn’t available yet. It appears here in the 16
          days before the walk.
        </p>
      </ForecastFrame>
    );
  }
  if (window.days.length === 0) {
    return (
      <ForecastFrame place={area}>
        <p className="text-sm text-muted-foreground">The forecast couldn’t be loaded just now.</p>
      </ForecastFrame>
    );
  }

  return (
    <WalkForecastCard
      days={window.days}
      place={area}
      today={londonDateKey(new Date())}
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
}: {
  cancelledAt: Date | null;
  durationMins: number;
  endedAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  place: string;
  startsAt: Date;
}) {
  const status = walkStatus({ cancelledAt, durationMins, endedAt, startsAt });
  if (status === "completed" || status === "cancelled") return null;
  if (latitude == null || longitude == null || !place) return null;

  return (
    <Suspense fallback={<ForecastSkeleton place={place} />}>
      <WalkForecastLoaded latitude={latitude} longitude={longitude} place={place} startsAt={startsAt} />
    </Suspense>
  );
}
