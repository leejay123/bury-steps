import { Suspense } from "react";
import { loadDailyForecast, loadForecastPlaceName } from "@/lib/weather-forecast";
import { forecastWindow, londonDateKey } from "@/lib/weather";
import { formatWalkDay } from "@/lib/dates";
import { walkStatus } from "@/lib/walk-window";
import { Skeleton } from "@/components/ui/skeleton";
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

function ForecastSkeleton() {
  return (
    <Card className="gap-4">
      <CardHeader className="gap-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-28 w-full" />
      </CardContent>
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
  let area = place;
  try {
    area = (await loadForecastPlaceName(latitude, longitude)) || place;
  } catch {
    area = place;
  }
  let days;
  try {
    days = await loadDailyForecast(latitude, longitude);
  } catch {
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
    <Suspense fallback={<ForecastSkeleton />}>
      <WalkForecastLoaded latitude={latitude} longitude={longitude} place={place} startsAt={startsAt} />
    </Suspense>
  );
}
