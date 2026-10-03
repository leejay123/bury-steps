import { describe, expect, it } from "vitest";
import { forecastWindow, mapOpenMeteoDaily, type ForecastDay } from "./weather";

function day(date: string): ForecastDay {
  return {
    date,
    weekday: "Mon",
    dayNum: date.slice(8, 10),
    tempMax: 12,
    tempMin: 6,
    weatherCode: 2,
    kind: "partly",
    condition: "Partly cloudy",
    windMph: 8,
    rainChance: 20,
  };
}

describe("mapOpenMeteoDaily", () => {
  it("maps a daily block into Celsius rows and skips a day with no temperature", () => {
    const days = mapOpenMeteoDaily({
      daily: {
        time: ["2026-10-03", "2026-10-04"],
        weather_code: [2, 61],
        temperature_2m_max: [14.4, null],
        temperature_2m_min: [7.6, 4],
        wind_speed_10m_max: [11.2, 5],
        precipitation_probability_max: [30, 80],
      },
    });
    expect(days).toHaveLength(1);
    expect(days[0]).toMatchObject({
      date: "2026-10-03",
      weekday: "Sat",
      dayNum: "3",
      tempMax: 14,
      tempMin: 8,
      kind: "partly",
      condition: "Partly cloudy",
      windMph: 11,
      rainChance: 30,
    });
  });
});

describe("forecastWindow", () => {
  const days = Array.from({ length: 16 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 9, 3 + index));
    const ymd = date.toISOString().slice(0, 10);
    return day(ymd);
  });

  it("shows the next seven days and includes a midweek walk", () => {
    const window = forecastWindow(days, "2026-10-07");
    expect(window.walkDateInWindow).toBe(true);
    expect(window.availableLater).toBe(false);
    expect(window.days.map((item) => item.date)).toEqual([
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
    ]);
  });

  it("slides the seven days so a later walk still sits on the strip", () => {
    const window = forecastWindow(days, "2026-10-16");
    expect(window.days).toHaveLength(7);
    expect(window.days[6]?.date).toBe("2026-10-16");
    expect(window.walkDateInWindow).toBe(true);
  });

  it("says the forecast is not available yet when the walk is further out", () => {
    const window = forecastWindow(days, "2026-11-01");
    expect(window.days).toEqual([]);
    expect(window.availableLater).toBe(true);
  });
});
