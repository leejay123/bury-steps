"use client";

import { useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ForecastDay, WeatherKind } from "@/lib/weather";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const ICONS: Record<WeatherKind, LucideIcon> = {
  clear: Sun,
  partly: CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

function DayIcon({ kind }: { kind: WeatherKind }) {
  const Icon = ICONS[kind];
  return <Icon aria-hidden className="size-4" />;
}

export function WalkForecastCard({
  days,
  place,
  walkDate,
}: {
  days: ForecastDay[];
  place: string;
  /** UK date of this walk, when it falls inside `days`. */
  walkDate: string | null;
}) {
  const initial = days.find((day) => day.date === walkDate)?.date ?? days[0]?.date ?? "";
  const [selectedDate, setSelectedDate] = useState(initial);
  const selected = days.find((day) => day.date === selectedDate) ?? days[0];
  if (!selected) return null;

  return (
    <Card className="gap-4">
      <CardHeader className="gap-1">
        <CardTitle className="text-base">7-day forecast</CardTitle>
        <CardDescription>{place}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="-mx-2 overflow-x-auto px-2">
          <div className="grid min-w-[22rem] grid-cols-7 gap-1" role="group" aria-label="Seven day forecast">
            {days.map((day) => {
              const isWalk = day.date === walkDate;
              const isSelected = day.date === selected.date;
              return (
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    "flex min-w-0 flex-col items-center gap-1 rounded-lg px-0.5 py-2 text-xs transition-colors hover:bg-muted/70",
                    isSelected && "bg-muted",
                    isWalk && "ring-1 ring-foreground",
                  )}
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  type="button"
                >
                  <span className="font-medium">{day.weekday}</span>
                  <span className="text-muted-foreground">{day.dayNum}</span>
                  <DayIcon kind={day.kind} />
                  <span className="font-semibold tabular-nums">{day.tempMax}°</span>
                  <span className="text-muted-foreground tabular-nums">{day.tempMin}°</span>
                  <span
                    className={cn(
                      "text-[10px] font-medium tracking-wide uppercase",
                      isWalk ? "text-foreground" : "invisible",
                    )}
                  >
                    Walk
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-2xl font-semibold tabular-nums">
              {selected.tempMax}°
              <span className="text-base font-normal text-muted-foreground">/{selected.tempMin}°</span>
            </p>
            <p className="text-sm">{selected.condition}</p>
            {selected.date === walkDate ? <Badge variant="secondary">This walk</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {selected.weekday} {selected.dayNum} at the meeting point.
            {selected.date === walkDate ? " This is the day you walk." : ""}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {selected.windMph} mph wind
            {selected.rainChance !== null ? ` · ${selected.rainChance}% chance of rain` : ""}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <a
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          href="https://open-meteo.com/"
          rel="noopener noreferrer"
          target="_blank"
        >
          Weather data by Open-Meteo
        </a>
      </CardFooter>
    </Card>
  );
}
