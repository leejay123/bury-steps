import { londonYmd } from "@/lib/dates";

/** WMO weather interpretation code, grouped for an icon. */
export type WeatherKind =
  | "clear"
  | "partly"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

export type ForecastDay = {
  /** UK calendar date, `YYYY-MM-DD`. */
  date: string;
  /** Short weekday, e.g. "Sat". Whichever day the walk falls on. */
  weekday: string;
  /** Day of the month, e.g. "3". */
  dayNum: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  kind: WeatherKind;
  condition: string;
  /** Rounded miles per hour. */
  windMph: number;
  /** 0–100, or null when the forecast has no rain figure. */
  rainChance: number | null;
};

export type ForecastWindow = {
  days: ForecastDay[];
  /** The walk's own date is one of `days`. */
  walkDateInWindow: boolean;
  /** The walk is further ahead than this forecast reaches. */
  availableLater: boolean;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** UK calendar date of an instant, `YYYY-MM-DD`. Walks are not tied to Sunday. */
export function londonDateKey(at: Date): string {
  const { year, month, day } = londonYmd(at);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function weekdayShort(ymd: string): string {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function weatherKind(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) return "drizzle";
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) return "snow";
  if (code === 95 || code === 96 || code === 99) return "storm";
  return "rain";
}

const CONDITION_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

export function weatherCondition(code: number): string {
  return CONDITION_LABELS[code] ?? "Mixed conditions";
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function numList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Open-Meteo `daily` block → one row per date. Skips days missing a temperature. */
export function mapOpenMeteoDaily(payload: unknown): ForecastDay[] {
  if (!payload || typeof payload !== "object") return [];
  const daily = (payload as { daily?: unknown }).daily;
  if (!daily || typeof daily !== "object") return [];
  const block = daily as Record<string, unknown>;
  const time = numList(block.time);
  const codes = numList(block.weather_code);
  const maxes = numList(block.temperature_2m_max);
  const mins = numList(block.temperature_2m_min);
  const winds = numList(block.wind_speed_10m_max);
  const rain = numList(block.precipitation_probability_max);

  const days: ForecastDay[] = [];
  for (let i = 0; i < time.length; i++) {
    const date = time[i];
    const tempMax = num(maxes[i]);
    const tempMin = num(mins[i]);
    const code = num(codes[i]);
    const wind = num(winds[i]);
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (tempMax === null || tempMin === null || code === null) continue;
    const rainChance = num(rain[i]);
    days.push({
      date,
      weekday: weekdayShort(date),
      dayNum: String(Number(date.slice(8, 10))),
      tempMax: Math.round(tempMax),
      tempMin: Math.round(tempMin),
      weatherCode: code,
      kind: weatherKind(code),
      condition: weatherCondition(code),
      windMph: wind === null ? 0 : Math.round(wind),
      rainChance: rainChance === null ? null : Math.round(rainChance),
    });
  }
  return days;
}

/**
 * Seven days that include the walk when the forecast reaches it.
 * A walk later than the forecast returns no days (`availableLater`).
 * A walk already behind today's forecast (for example it started before
 * midnight and is still going) shows the coming seven days unmarked.
 */
export function forecastWindow(days: ForecastDay[], walkDate: string): ForecastWindow {
  if (days.length === 0) {
    return { days: [], walkDateInWindow: false, availableLater: false };
  }
  const index = days.findIndex((day) => day.date === walkDate);
  if (index === -1) {
    if (walkDate > days[days.length - 1].date) {
      return { days: [], walkDateInWindow: false, availableLater: true };
    }
    return { days: days.slice(0, 7), walkDateInWindow: false, availableLater: false };
  }
  if (index <= 6) {
    return { days: days.slice(0, 7), walkDateInWindow: true, availableLater: false };
  }
  return {
    days: days.slice(index - 6, index + 1),
    walkDateInWindow: true,
    availableLater: false,
  };
}
