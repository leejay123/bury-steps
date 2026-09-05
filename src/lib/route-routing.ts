/**
 * Optional upgrade over the plain click-to-click straight lines in
 * route-geometry.ts: if an OpenRouteService API key is configured, the
 * points an organiser clicked are treated as waypoints and sent to ORS's
 * foot-walking directions, which snaps them onto the real footpath/street
 * network and returns the actual path between them.
 *
 * Deliberately optional and fully backward compatible: with no key set,
 * `snapToFootpaths` returns the waypoints unchanged (today's behaviour) —
 * nothing about the stored `points` format changes, so this can be turned
 * on or off at any time without touching existing routes. See the "next
 * step" note this feature shipped with: OpenRouteService's free tier needs
 * a free account and API key (no card), which is why it isn't on by
 * default.
 */

import { type RoutePoint, routeDistanceMetres } from "./route-geometry";
import { orsApiKey, orsBaseUrl } from "./ors-config";

const ORS_DIRECTIONS_URL = `${orsBaseUrl()}/openrouteservice/v2/directions/foot-walking/geojson`;
const ORS_TIMEOUT_MS = 12_000;

/** Narrowed to what this module actually uses, so tests can pass a plain mock. */
type FetchLike = (
  url: string,
  init: RequestInit,
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

/**
 * ORS's own practical ceiling on waypoints in one directions request on the
 * free tier. Snapping exists so an organiser clicks *fewer* points, not
 * more, so hitting this means "draw fewer, further-apart clicks" rather
 * than something to raise.
 */
export const MAX_ORS_WAYPOINTS = 50;

export type SnapOutcome = {
  points: RoutePoint[];
  distanceMetres: number;
  snapped: boolean;
  /** Set when snapping was attempted (or skipped) and didn't happen — shown to the organiser. */
  note?: string;
};

function straightLineFallback(waypoints: RoutePoint[], note?: string): SnapOutcome {
  return {
    points: waypoints,
    distanceMetres: routeDistanceMetres(waypoints),
    snapped: false,
    ...(note ? { note } : {}),
  };
}

function parseOrsResponse(data: unknown): { points: RoutePoint[]; distanceMetres: number } | null {
  if (!data || typeof data !== "object") return null;
  const features = (data as { features?: unknown }).features;
  if (!Array.isArray(features) || features.length === 0) return null;

  const feature = features[0] as { geometry?: unknown; properties?: unknown };
  const geometry = feature.geometry as { type?: unknown; coordinates?: unknown } | undefined;
  if (!geometry || geometry.type !== "LineString" || !Array.isArray(geometry.coordinates)) {
    return null;
  }

  const points: RoutePoint[] = [];
  for (const coord of geometry.coordinates) {
    // ORS (and GeoJSON generally) is [lng, lat], the reverse of RoutePoint.
    if (!Array.isArray(coord) || coord.length < 2) return null;
    const [lng, lat] = coord;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    points.push({ lat, lng });
  }
  if (points.length < 2) return null;

  const properties = feature.properties as { summary?: { distance?: unknown } } | undefined;
  const summaryDistance = properties?.summary?.distance;
  const distanceMetres =
    typeof summaryDistance === "number" ? summaryDistance : routeDistanceMetres(points);

  return { points, distanceMetres };
}

/**
 * Snaps a drawn route onto real footpaths, if OPENROUTESERVICE_API_KEY is
 * configured. Always returns something safe to store: on any failure
 * (network error, ORS couldn't find a path, too many waypoints, no key)
 * it falls back to the waypoints exactly as clicked, unchanged.
 */
export async function snapToFootpaths(
  waypoints: RoutePoint[],
  options?: { fetchImpl?: FetchLike },
): Promise<SnapOutcome> {
  const apiKey = orsApiKey();
  if (!apiKey) return straightLineFallback(waypoints);
  if (waypoints.length < 2) return straightLineFallback(waypoints);
  if (waypoints.length > MAX_ORS_WAYPOINTS) {
    return straightLineFallback(
      waypoints,
      `Not matched to paths — a route with ${waypoints.length} points is too finely drawn for that. ` +
        "Click fewer, further-apart points (a handful of waypoints, not every bend) to use it.",
    );
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl(ORS_DIRECTIONS_URL, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        Accept: "application/geo+json",
      },
      body: JSON.stringify({ coordinates: waypoints.map((p) => [p.lng, p.lat]) }),
      signal: AbortSignal.timeout(ORS_TIMEOUT_MS),
    });

    if (!res.ok) {
      return straightLineFallback(
        waypoints,
        "Couldn't match this route to real paths right now — saved as drawn.",
      );
    }

    const parsed = parseOrsResponse(await res.json());
    if (!parsed) {
      return straightLineFallback(
        waypoints,
        "Couldn't match this route to real paths right now — saved as drawn.",
      );
    }
    return { points: parsed.points, distanceMetres: parsed.distanceMetres, snapped: true };
  } catch {
    return straightLineFallback(
      waypoints,
      "Couldn't match this route to real paths right now — saved as drawn.",
    );
  }
}
