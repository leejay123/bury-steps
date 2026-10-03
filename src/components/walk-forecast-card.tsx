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
  Droplets,
  MapPin,
  Sun,
  Sunrise,
  Sunset,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { forecastSummary, type ForecastDay, type WeatherKind } from "@/lib/weather";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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

function DayIcon({ kind, className }: { kind: WeatherKind; className?: string }) {
  const Icon = ICONS[kind];
  return <Icon aria-hidden className={className ?? "size-5"} />;
}

export function WalkForecastCard({
  days,
  place,
  today,
  walkDate,
}: {
  days: ForecastDay[];
  place: string;
  /** UK date for "Today" on the strip. */
  today: string;
  /** UK date of this walk, when it falls inside `days`. */
  walkDate: string | null;
}) {
  const initial = days.find((day) => day.date === walkDate)?.date ?? days[0]?.date ?? "";
  const [selectedDate, setSelectedDate] = useState(initial);
  const selected = days.find((day) => day.date === selectedDate) ?? days[0];
  if (!selected) return null;
  const isWalkDay = selected.date === walkDate;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sun aria-hidden className="size-4" />
          7-day forecast
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin aria-hidden className="size-4 shrink-0" />
          <span className="truncate">{place}</span>
        </div>
      </div>

      <div className="grid grid-cols-7 border-y" role="group" aria-label="Seven day forecast">
        {days.map((day) => {
          const isSelected = day.date === selected.date;
          const heading = day.date === today ? "Today" : day.weekday;
          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1.5 border-r px-0.5 py-3 text-center last:border-r-0 sm:gap-2 sm:py-4",
                isSelected ? "bg-muted" : "hover:bg-muted/50",
              )}
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              type="button"
            >
              <span className="text-xs font-medium sm:text-sm">{heading}</span>
              <span className="text-[11px] text-muted-foreground sm:text-xs">{day.dateLabel}</span>
              <DayIcon kind={day.kind} />
              <span className="text-xs tabular-nums sm:text-sm">
                <span className="font-semibold">{day.tempMax}°</span>
                <span className="text-muted-foreground"> {day.tempMin}°</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {selected.tempMax}°
            <span className="text-xl font-normal text-muted-foreground">/{selected.tempMin}°</span>
          </p>
          <p className="text-sm text-muted-foreground">{selected.condition}</p>
          {isWalkDay ? <Badge variant="secondary">This walk</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{forecastSummary(selected)}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Wind aria-hidden className="size-3.5" />
            {selected.windMph} mph
          </span>
          {selected.humidity !== null ? (
            <span className="inline-flex items-center gap-1.5">
              <Droplets aria-hidden className="size-3.5" />
              {selected.humidity}%
            </span>
          ) : null}
          {selected.sunrise ? (
            <span className="inline-flex items-center gap-1.5">
              <Sunrise aria-hidden className="size-3.5" />
              {selected.sunrise}
            </span>
          ) : null}
          {selected.sunset ? (
            <span className="inline-flex items-center gap-1.5">
              <Sunset aria-hidden className="size-3.5" />
              {selected.sunset}
            </span>
          ) : null}
        </div>

        {selected.hours.length > 0 ? (
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-1">
            {selected.hours.map((hour) => (
              <div
                className="flex w-14 shrink-0 flex-col items-center gap-1 rounded-md border bg-background px-1 py-2 text-xs"
                key={hour.time}
              >
                <span className="text-muted-foreground tabular-nums">{hour.time}</span>
                <DayIcon className="size-4" kind={hour.kind} />
                <span className="font-medium tabular-nums">{hour.temp}°</span>
              </div>
            ))}
          </div>
        ) : null}

        <a
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          href="https://open-meteo.com/"
          rel="noopener noreferrer"
          target="_blank"
        >
          Weather data by Open-Meteo
        </a>
      </div>
    </Card>
  );
}
