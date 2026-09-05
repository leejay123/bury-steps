import { describe, expect, it } from "vitest";
import {
  MAX_ROUTE_POINTS,
  cumulativeDistancesMetres,
  formatMiles,
  formatWalkEstimate,
  haversineMetres,
  isCircular,
  metresToMiles,
  parseRoutePoints,
  routeBounds,
  routeDistanceMetres,
  validateRoutePoints,
} from "./route-geometry";

// Bury town centre and Burrs Country Park — a real pair, ~2.4 km apart.
const BURY = { lat: 53.5933, lng: -2.2966 };
const BURRS = { lat: 53.6132, lng: -2.3138 };

describe("haversineMetres", () => {
  it("is zero for the same point", () => {
    expect(haversineMetres(BURY, BURY)).toBe(0);
  });

  it("measures a known local distance", () => {
    const metres = haversineMetres(BURY, BURRS);
    expect(metres).toBeGreaterThan(2300);
    expect(metres).toBeLessThan(2600);
  });

  it("is symmetric", () => {
    expect(haversineMetres(BURY, BURRS)).toBeCloseTo(haversineMetres(BURRS, BURY), 6);
  });
});

describe("routeDistanceMetres", () => {
  it("is zero for an empty or single-point route", () => {
    expect(routeDistanceMetres([])).toBe(0);
    expect(routeDistanceMetres([BURY])).toBe(0);
  });

  it("sums the legs", () => {
    const oneLeg = routeDistanceMetres([BURY, BURRS]);
    const thereAndBack = routeDistanceMetres([BURY, BURRS, BURY]);
    expect(thereAndBack).toBeCloseTo(oneLeg * 2, 6);
  });

  it("measures short between two points on a curve — the coarse-click caveat", () => {
    // A straight line clicked only at its ends is always shorter than the
    // same path clicked along the bend. This is the documented trade-off of
    // drawing without a routing service, so pin it down.
    const bend = { lat: 53.6132, lng: -2.2966 };
    const coarse = routeDistanceMetres([BURY, BURRS]);
    const detailed = routeDistanceMetres([BURY, bend, BURRS]);
    expect(detailed).toBeGreaterThan(coarse);
  });
});

describe("cumulativeDistancesMetres", () => {
  it("starts at zero and matches routeDistanceMetres at the end", () => {
    const points = [BURY, { lat: 53.6, lng: -2.3 }, BURRS];
    const distances = cumulativeDistancesMetres(points);
    expect(distances).toHaveLength(3);
    expect(distances[0]).toBe(0);
    expect(distances[distances.length - 1]).toBeCloseTo(routeDistanceMetres(points), 6);
  });

  it("is non-decreasing (points are never revisited going backwards in distance)", () => {
    const points = [BURY, { lat: 53.6, lng: -2.3 }, BURRS, BURY];
    const distances = cumulativeDistancesMetres(points);
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
  });

  it("is empty for no points, zero for one", () => {
    expect(cumulativeDistancesMetres([])).toEqual([]);
    expect(cumulativeDistancesMetres([BURY])).toEqual([0]);
  });
});

describe("formatMiles", () => {
  it("renders miles to one decimal place", () => {
    expect(formatMiles(1609.344 * 3)).toBe("3.0 miles");
    expect(formatMiles(1609.344 * 2.46)).toBe("2.5 miles");
  });

  it("uses the singular at exactly one mile", () => {
    expect(formatMiles(1609.344)).toBe("1.0 mile");
  });

  it("avoids reporting a real route as 0.0 miles", () => {
    expect(formatMiles(30)).toBe("under 0.1 miles");
  });

  it("still reports an empty route as zero", () => {
    expect(formatMiles(0)).toBe("0.0 miles");
  });
});

describe("metresToMiles", () => {
  it("converts using the statute mile", () => {
    expect(metresToMiles(1609.344)).toBeCloseTo(1, 9);
  });
});

describe("formatWalkEstimate", () => {
  it("rounds to five minutes under an hour", () => {
    expect(formatWalkEstimate(1000)).toBe("about 20 minutes");
  });

  it("never claims a walk takes under five minutes", () => {
    expect(formatWalkEstimate(50)).toBe("about 5 minutes");
  });

  it("switches to hours above an hour", () => {
    expect(formatWalkEstimate(3000)).toBe("about 1 hour");
    expect(formatWalkEstimate(6000)).toBe("about 2 hours");
  });

  it("adds a quarter-hour remainder", () => {
    expect(formatWalkEstimate(4500)).toBe("about 1 hour 30 minutes");
  });
});

describe("parseRoutePoints", () => {
  it("returns points unchanged for a valid array", () => {
    expect(parseRoutePoints([BURY, BURRS])).toEqual([BURY, BURRS]);
  });

  it("rounds off meaningless precision", () => {
    const [point] = parseRoutePoints([{ lat: 53.59331234567891, lng: -2.29661234567891 }]);
    expect(point).toEqual({ lat: 53.5933123, lng: -2.2966123 });
  });

  it("returns empty rather than throwing on rubbish", () => {
    expect(parseRoutePoints(null)).toEqual([]);
    expect(parseRoutePoints("not a route")).toEqual([]);
    expect(parseRoutePoints([{ lat: "53", lng: -2 }])).toEqual([]);
    expect(parseRoutePoints([{ lat: 91, lng: 0 }])).toEqual([]);
    expect(parseRoutePoints([{ lat: Number.NaN, lng: 0 }])).toEqual([]);
  });
});

describe("validateRoutePoints", () => {
  it("accepts a two-point route", () => {
    const result = validateRoutePoints([BURY, BURRS]);
    expect(result).toEqual({ ok: true, points: [BURY, BURRS] });
  });

  it("rejects a single point with a plain-English message", () => {
    const result = validateRoutePoints([BURY]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("at least two points");
  });

  it("rejects an over-long route", () => {
    const tooMany = Array.from({ length: MAX_ROUTE_POINTS + 1 }, () => BURY);
    expect(validateRoutePoints(tooMany).ok).toBe(false);
  });

  it("rejects a malformed payload", () => {
    expect(validateRoutePoints([BURY, { lat: 0 }]).ok).toBe(false);
    expect(validateRoutePoints("nope").ok).toBe(false);
  });
});

describe("routeBounds", () => {
  it("is null with nothing to fit", () => {
    expect(routeBounds([])).toBeNull();
  });

  it("covers every point", () => {
    expect(routeBounds([BURY, BURRS])).toEqual({
      south: BURY.lat,
      west: BURRS.lng,
      north: BURRS.lat,
      east: BURY.lng,
    });
  });
});

describe("isCircular", () => {
  it("spots a loop back to the start", () => {
    expect(isCircular([BURY, BURRS, { lat: 53.5933, lng: -2.29662 }])).toBe(true);
  });

  it("is false for a there-and-not-back route", () => {
    expect(isCircular([BURY, { lat: 53.6, lng: -2.3 }, BURRS])).toBe(false);
  });

  it("is false for a two-point route", () => {
    expect(isCircular([BURY, BURY])).toBe(false);
  });
});
