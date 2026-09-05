import { describe, expect, it } from "vitest";
import {
  computeElevationStats,
  parseElevationProfile,
  parseGpx,
  parseGpxForRoute,
  simplifyRoute,
  simplifyToLimit,
} from "./gpx";
import { routeDistanceMetres, type RoutePoint } from "./route-geometry";

const BURY = { lat: 53.5933, lng: -2.2966 };
const BURRS = { lat: 53.6132, lng: -2.3138 };

function gpxTrack(
  points: { lat: number; lng: number }[],
  options?: { name?: string; elevations?: (number | null)[] },
): string {
  const trkpts = points
    .map((p, i) => {
      const ele = options?.elevations?.[i];
      const eleTag = ele === undefined ? "<ele>120</ele>" : ele === null ? "" : `<ele>${ele}</ele>`;
      return `<trkpt lat="${p.lat}" lon="${p.lng}">${eleTag}</trkpt>`;
    })
    .join("\n");
  return `<?xml version="1.0"?>
<gpx version="1.1"><trk>${options?.name ? `<name>${options.name}</name>` : ""}<trkseg>${trkpts}</trkseg></trk></gpx>`;
}

describe("parseGpx", () => {
  it("reads trkpt points and the track name", () => {
    const xml = gpxTrack([BURY, BURRS], { name: "Burrs loop" });
    const result = parseGpx(xml);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.points).toEqual([BURY, BURRS]);
      expect(result.name).toBe("Burrs loop");
    }
  });

  it("reads self-closing trkpt tags", () => {
    const xml = `<gpx><trk><trkseg>
      <trkpt lat="${BURY.lat}" lon="${BURY.lng}"/>
      <trkpt lat="${BURRS.lat}" lon="${BURRS.lng}"/>
    </trkseg></trk></gpx>`;
    const result = parseGpx(xml);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.points).toEqual([BURY, BURRS]);
  });

  it("reads a planned route (rtept) when there is no track", () => {
    const xml = `<gpx><rte><rtept lat="${BURY.lat}" lon="${BURY.lng}"/><rtept lat="${BURRS.lat}" lon="${BURRS.lng}"/></rte></gpx>`;
    const result = parseGpx(xml);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.points).toEqual([BURY, BURRS]);
  });

  it("is order-independent for lat/lon attributes", () => {
    const xml = `<gpx><trk><trkseg><trkpt lon="${BURY.lng}" lat="${BURY.lat}"/><trkpt lon="${BURRS.lng}" lat="${BURRS.lat}"/></trkseg></trk></gpx>`;
    const result = parseGpx(xml);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.points).toEqual([BURY, BURRS]);
  });

  it("flattens multiple tracks and segments into one ordered line", () => {
    const xml = `<gpx>
      <trk><trkseg><trkpt lat="${BURY.lat}" lon="${BURY.lng}"/></trkseg></trk>
      <trk><trkseg><trkpt lat="${BURRS.lat}" lon="${BURRS.lng}"/></trkseg></trk>
    </gpx>`;
    const result = parseGpx(xml);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.points).toEqual([BURY, BURRS]);
  });

  it("skips points with out-of-range coordinates", () => {
    const xml = `<gpx><trk><trkseg><trkpt lat="${BURY.lat}" lon="${BURY.lng}"/><trkpt lat="999" lon="${BURRS.lng}"/></trkseg></trk></gpx>`;
    const result = parseGpx(xml);
    expect(result.ok).toBe(false);
  });

  it("rejects a file with fewer than two points", () => {
    const xml = `<gpx><trk><trkseg><trkpt lat="${BURY.lat}" lon="${BURY.lng}"/></trkseg></trk></gpx>`;
    const result = parseGpx(xml);
    expect(result).toEqual({
      ok: false,
      error: "No track found in that file — check it's a .gpx export with at least two points.",
    });
  });

  it("rejects a file with no points at all", () => {
    expect(parseGpx("<gpx><metadata>not a track</metadata></gpx>").ok).toBe(false);
    expect(parseGpx("not even xml").ok).toBe(false);
  });

  it("computes elevation stats when every point has one", () => {
    const points = [BURY, { lat: 53.6, lng: -2.3 }, BURRS];
    const xml = gpxTrack(points, { elevations: [150, 180, 160] });
    const result = parseGpx(xml);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.elevation).toEqual({
        gainMetres: 30,
        lossMetres: 20,
        maxMetres: 180,
        minMetres: 150,
      });
    }
  });

  it("gives no elevation stats when any point is missing one", () => {
    const points = [BURY, { lat: 53.6, lng: -2.3 }, BURRS];
    const xml = gpxTrack(points, { elevations: [150, null, 160] });
    const result = parseGpx(xml);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.elevation).toBeNull();
  });

  it("gives no elevation stats for a file with none at all (e.g. a planned route)", () => {
    const xml = `<gpx><rte><rtept lat="${BURY.lat}" lon="${BURY.lng}"/><rtept lat="${BURRS.lat}" lon="${BURRS.lng}"/></rte></gpx>`;
    const result = parseGpx(xml);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.elevation).toBeNull();
  });

  it("returns an elevation profile aligned with points when every point has one", () => {
    const points = [BURY, { lat: 53.6, lng: -2.3 }, BURRS];
    const xml = gpxTrack(points, { elevations: [150, 180, 160] });
    const result = parseGpx(xml);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.elevationProfile).toEqual([150, 180, 160]);
  });

  it("gives no elevation profile when the file's profile is partial or absent", () => {
    const points = [BURY, { lat: 53.6, lng: -2.3 }, BURRS];
    const partial = parseGpx(gpxTrack(points, { elevations: [150, null, 160] }));
    expect(partial.ok).toBe(true);
    if (partial.ok) expect(partial.elevationProfile).toBeNull();

    const none = parseGpx(
      `<gpx><rte><rtept lat="${BURY.lat}" lon="${BURY.lng}"/><rtept lat="${BURRS.lat}" lon="${BURRS.lng}"/></rte></gpx>`,
    );
    expect(none.ok).toBe(true);
    if (none.ok) expect(none.elevationProfile).toBeNull();
  });
});

describe("parseElevationProfile", () => {
  it("accepts an array of finite numbers matching the expected length", () => {
    expect(parseElevationProfile([100, 120, 110], 3)).toEqual([100, 120, 110]);
  });

  it("rejects a length mismatch — a route whose profile no longer lines up with its points", () => {
    expect(parseElevationProfile([100, 120, 110], 4)).toBeNull();
  });

  it("rejects anything that isn't an array of finite numbers", () => {
    expect(parseElevationProfile(null, 3)).toBeNull();
    expect(parseElevationProfile("not an array", 3)).toBeNull();
    expect(parseElevationProfile([100, "120", 110], 3)).toBeNull();
    expect(parseElevationProfile([100, Infinity, 110], 3)).toBeNull();
  });
});

describe("computeElevationStats", () => {
  it("is null with fewer than two samples", () => {
    expect(computeElevationStats([])).toBeNull();
    expect(computeElevationStats([100])).toBeNull();
  });

  it("sums real climbs and descents", () => {
    expect(computeElevationStats([100, 120, 110, 130])).toEqual({
      gainMetres: 40,
      lossMetres: 10,
      maxMetres: 130,
      minMetres: 100,
    });
  });

  it("ignores jitter under the noise threshold", () => {
    // Each step is under 2m — barometric/GPS noise, not a real climb.
    expect(computeElevationStats([100, 101, 100.5, 101.5, 100])).toEqual({
      gainMetres: 0,
      lossMetres: 0,
      maxMetres: 101.5,
      minMetres: 100,
    });
  });

  it("still tracks max/min through jitter that never counts as gain or loss", () => {
    const stats = computeElevationStats([100, 101, 100.2]);
    expect(stats?.maxMetres).toBe(101);
    expect(stats?.minMetres).toBe(100);
  });
});

describe("simplifyRoute", () => {
  it("drops a point that sits within tolerance of the straight line", () => {
    // BURY and BURRS are ~2.4km apart; a point 1m off the midpoint of that
    // line should vanish at a 5m tolerance but survive at 0.1m.
    const midLat = (BURY.lat + BURRS.lat) / 2;
    const midLng = (BURY.lng + BURRS.lng) / 2;
    const nudged = { lat: midLat + 0.00001, lng: midLng }; // ~1.1m north of the line
    const points = [BURY, nudged, BURRS];

    expect(simplifyRoute(points, 5)).toEqual([BURY, BURRS]);
    expect(simplifyRoute(points, 0.1)).toEqual(points);
  });

  it("keeps a real corner regardless of tolerance", () => {
    const corner = { lat: 53.62, lng: -2.29 }; // well off the BURY-BURRS line
    const points = [BURY, corner, BURRS];
    expect(simplifyRoute(points, 50)).toEqual(points);
  });

  it("leaves short routes alone", () => {
    expect(simplifyRoute([BURY, BURRS], 5)).toEqual([BURY, BURRS]);
    expect(simplifyRoute([BURY], 5)).toEqual([BURY]);
  });
});

describe("simplifyToLimit", () => {
  it("leaves a route under the limit unchanged", () => {
    expect(simplifyToLimit([BURY, BURRS], 10)).toEqual([BURY, BURRS]);
  });

  it("thins a dense straight line down to the limit, keeping the ends", () => {
    // 500 points along one straight line between BURY and BURRS.
    const points: RoutePoint[] = Array.from({ length: 500 }, (_, i) => ({
      lat: BURY.lat + (BURRS.lat - BURY.lat) * (i / 499),
      lng: BURY.lng + (BURRS.lng - BURY.lng) * (i / 499),
    }));
    const simplified = simplifyToLimit(points, 50);
    expect(simplified.length).toBeLessThanOrEqual(50);
    expect(simplified[0]).toEqual(BURY);
    expect(simplified[simplified.length - 1]).toEqual(BURRS);
    // A straight line simplifies to just its two ends regardless of the limit.
    expect(simplified.length).toBe(2);
  });

  it("barely changes total distance even when it has to thin a lot", () => {
    // A gentle zigzag so there is real shape to preserve, not a straight line.
    const points: RoutePoint[] = Array.from({ length: 300 }, (_, i) => {
      const t = i / 299;
      const wobble = Math.sin(i / 3) * 0.0006;
      return {
        lat: BURY.lat + (BURRS.lat - BURY.lat) * t + wobble,
        lng: BURY.lng + (BURRS.lng - BURY.lng) * t,
      };
    });
    const before = routeDistanceMetres(points);
    const simplified = simplifyToLimit(points, 40);
    const after = routeDistanceMetres(simplified);
    expect(simplified.length).toBeLessThanOrEqual(40);
    expect(after).toBeGreaterThan(before * 0.9);
  });
});

describe("parseGpxForRoute", () => {
  it("passes a small trace through unchanged", () => {
    const result = parseGpxForRoute(gpxTrack([BURY, BURRS]));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.points).toEqual([BURY, BURRS]);
      expect("simplifiedFrom" in result).toBe(false);
    }
  });

  it("simplifies and reports the original count for a trace over the cap", () => {
    const points: RoutePoint[] = Array.from({ length: 2100 }, (_, i) => ({
      lat: BURY.lat + (BURRS.lat - BURY.lat) * (i / 2099),
      lng: BURY.lng + (BURRS.lng - BURY.lng) * (i / 2099),
    }));
    // gpxTrack's default <ele>120</ele> gives every point a (flat) profile,
    // so this also exercises thinning it in lockstep with the points below.
    const result = parseGpxForRoute(gpxTrack(points));
    expect(result.ok).toBe(true);
    if (result.ok && "simplifiedFrom" in result) {
      expect(result.simplifiedFrom).toBe(2100);
      expect(result.points.length).toBeLessThanOrEqual(2000);
      expect(result.elevationProfile).not.toBeNull();
      expect(result.elevationProfile).toHaveLength(result.points.length);
      expect(result.elevationProfile?.every((e) => e === 120)).toBe(true);
    } else {
      throw new Error("expected a simplifiedFrom result");
    }
  });

  it("keeps no elevation profile when the file had none", () => {
    const result = parseGpxForRoute(
      `<gpx><rte><rtept lat="${BURY.lat}" lon="${BURY.lng}"/><rtept lat="${BURRS.lat}" lon="${BURRS.lng}"/></rte></gpx>`,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.elevationProfile).toBeNull();
  });
});
