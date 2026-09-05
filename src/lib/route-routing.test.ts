import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_ORS_WAYPOINTS, snapToFootpaths } from "./route-routing";
import { routeDistanceMetres } from "./route-geometry";

const BURY = { lat: 53.5933, lng: -2.2966 };
const BURRS = { lat: 53.6132, lng: -2.3138 };

function orsResponse(coords: [number, number][], distance: number) {
  return {
    features: [
      {
        geometry: { type: "LineString", coordinates: coords },
        properties: { summary: { distance } },
      },
    ],
  };
}

describe("snapToFootpaths", () => {
  beforeEach(() => {
    delete process.env.OPENROUTESERVICE_API_KEY;
  });
  afterEach(() => {
    delete process.env.OPENROUTESERVICE_API_KEY;
  });

  it("returns the waypoints unchanged when no key is configured", async () => {
    const fetchImpl = vi.fn();
    const result = await snapToFootpaths([BURY, BURRS], { fetchImpl });
    expect(result).toEqual({
      points: [BURY, BURRS],
      distanceMetres: routeDistanceMetres([BURY, BURRS]),
      snapped: false,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("is a no-op below two points, even with a key configured", async () => {
    process.env.OPENROUTESERVICE_API_KEY = "test-key";
    const fetchImpl = vi.fn();
    const result = await snapToFootpaths([BURY], { fetchImpl });
    expect(result.snapped).toBe(false);
    expect(result.points).toEqual([BURY]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("declines to call ORS with more waypoints than its practical limit", async () => {
    process.env.OPENROUTESERVICE_API_KEY = "test-key";
    const fetchImpl = vi.fn();
    const tooMany = Array.from({ length: MAX_ORS_WAYPOINTS + 1 }, () => BURY);
    const result = await snapToFootpaths(tooMany, { fetchImpl });
    expect(result.snapped).toBe(false);
    expect(result.note).toContain("too finely drawn");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("snaps to the returned geometry and trusts ORS's own distance", async () => {
    process.env.OPENROUTESERVICE_API_KEY = "test-key";
    const coords: [number, number][] = [
      [BURY.lng, BURY.lat],
      [-2.301, 53.6],
      [BURRS.lng, BURRS.lat],
    ];
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => orsResponse(coords, 2500),
    });

    const result = await snapToFootpaths([BURY, BURRS], { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson");
    expect(init.headers.Authorization).toBe("test-key");
    expect(JSON.parse(init.body)).toEqual({
      coordinates: [
        [BURY.lng, BURY.lat],
        [BURRS.lng, BURRS.lat],
      ],
    });

    expect(result).toEqual({
      points: [BURY, { lat: 53.6, lng: -2.301 }, BURRS],
      distanceMetres: 2500,
      snapped: true,
    });
  });

  it("falls back to the straight line on a non-OK response", async () => {
    process.env.OPENROUTESERVICE_API_KEY = "test-key";
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });

    const result = await snapToFootpaths([BURY, BURRS], { fetchImpl });

    expect(result.snapped).toBe(false);
    expect(result.points).toEqual([BURY, BURRS]);
    expect(result.note).toContain("saved as drawn");
  });

  it("falls back to the straight line on a malformed response", async () => {
    process.env.OPENROUTESERVICE_API_KEY = "test-key";
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [] }) });

    const result = await snapToFootpaths([BURY, BURRS], { fetchImpl });

    expect(result.snapped).toBe(false);
    expect(result.note).toContain("saved as drawn");
  });

  it("falls back to the straight line when the request itself fails", async () => {
    process.env.OPENROUTESERVICE_API_KEY = "test-key";
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await snapToFootpaths([BURY, BURRS], { fetchImpl });

    expect(result.snapped).toBe(false);
    expect(result.distanceMetres).toBeCloseTo(routeDistanceMetres([BURY, BURRS]), 6);
    expect(result.note).toContain("saved as drawn");
  });
});
