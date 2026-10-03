import { cacheLife } from "next/cache";
import { mapOpenMeteoDaily, type ForecastDay } from "@/lib/weather";

/** About 1 km. Nearby walks share one saved forecast. */
function roundedCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Daily forecast for a meeting point. Open-Meteo needs no API key. The
 * saved copy lasts an hour so a busy walk page does not call them on
 * every refresh. Coordinates are the walk pin, never a member.
 */
export async function loadDailyForecast(
  latitude: number,
  longitude: number,
): Promise<ForecastDay[]> {
  "use cache";
  cacheLife({ revalidate: 60 * 60 });

  const lat = roundedCoordinate(latitude);
  const lon = roundedCoordinate(longitude);
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error("Meeting point is outside the forecast area.");
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_mean,sunrise,sunset",
  );
  url.searchParams.set("hourly", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "Europe/London");
  url.searchParams.set("forecast_days", "16");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("temperature_unit", "celsius");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "BurySteps/1.0 (walking group; https://burysteps-walkinggroup.co.uk)",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Open-Meteo responded ${response.status}`);
  }
  return mapOpenMeteoDaily(await response.json());
}
