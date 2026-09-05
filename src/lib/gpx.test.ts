import { describe, expect, it } from "vitest";
import { parseGpx, parseGpxForRoute, simplifyRoute, simplifyToLimit } from "./gpx";
import { routeDistanceMetres, type RoutePoint } from "./route-geometry";

const BURY = { lat: 53.5933, lng: -2.2966 };
const BURRS = { lat: 53.6132, lng: -2.3138 };

function gpxTrack(points: { lat: number; lng: number }[], name?: string): string {
  const trkpts = points
    .map((p) => `<trkpt lat="${p.lat}" lon="${p.lng}"><ele>120</ele></trkpt>`)
    .join("\n");
  return `<?xml version="1.0"?>
<gpx version="1.1"><trk>${name ? `<name>${name}</name>` : ""}<trkseg>${trkpts}</trkseg></trk></gpx>`;
}

describe("parseGpx", () => {
  it("reads trkpt points and the track name", () => {
    const xml = gpxTrack([BURY, BURRS], "Burrs loop");
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
    const result = parseGpxForRoute(gpxTrack(points));
    expect(result.ok).toBe(true);
    if (result.ok && "simplifiedFrom" in result) {
      expect(result.simplifiedFrom).toBe(2100);
      expect(result.points.length).toBeLessThanOrEqual(2000);
    } else {
      throw new Error("expected a simplifiedFrom result");
    }
  });
});
