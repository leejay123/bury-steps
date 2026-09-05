/**
 * Reads a GPX file (the standard export format from Strava, Garmin, OS
 * Maps, Komoot, Wikiloc, plotaroute.com, openrouteservice's own map
 * client, and pretty much anything else that records or plans a walk) and
 * turns it into the same RoutePoint[] shape a clicked route already uses,
 * plus elevation gain/loss/max/min when the file has elevation samples.
 *
 * A real recorded trace logs a point every few seconds, so it is already
 * far denser than anyone would click by hand — routeDistanceMetres's plain
 * haversine-over-points sum becomes accurate for free, no snapping needed.
 *
 * Deliberately not a full XML parser: GPX's point tags are a small, stable
 * shape across every producer (<trkpt lat="…" lon="…">…</trkpt> or
 * self-closing, same for <rtept>, attribute order not guaranteed), so a
 * tag-then-attribute regex reads every producer's output correctly without
 * a dependency, and works identically server- or client-side. It flattens
 * every track/segment/route in the file into one ordered line — the right
 * behaviour for the normal case (one file, one walk) and not something a
 * multi-track file would give a sensible route from anyway.
 */

import { MAX_ROUTE_POINTS, type RoutePoint } from "./route-geometry";

export type ElevationStats = {
  gainMetres: number;
  lossMetres: number;
  maxMetres: number;
  minMetres: number;
};

export type GpxParseResult =
  | { ok: true; points: RoutePoint[]; name: string | null; elevation: ElevationStats | null }
  | { ok: false; error: string };

// Captures the tag name, its attributes, and — for a paired (non
// self-closing) tag — everything up to its own matching close tag, so an
// <ele> child can be read from the same point it belongs to.
const POINT_TAG = /<(trkpt|rtept)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;
const ELE_TAG = /<ele>\s*(-?[\d.]+)\s*<\/ele>/i;
const NAME_TAG = /<name>([^<]*)<\/name>/i;

function attr(tagAttrs: string, name: string): number | null {
  const match = tagAttrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

/**
 * Hysteresis smoothing: a climb or descent only counts once it has moved
 * at least `thresholdMetres` from the last direction change, so ordinary
 * GPS/barometric jitter of a metre or two doesn't inflate gain and loss —
 * a naive sum of every up/down between raw samples wildly overstates both.
 * This is why our number won't match another site's to the metre for the
 * same file; nobody's does, since none publish their exact method.
 */
const ELEVATION_NOISE_THRESHOLD_METRES = 2;

export function computeElevationStats(elevations: number[]): ElevationStats | null {
  if (elevations.length < 2) return null;
  let gainMetres = 0;
  let lossMetres = 0;
  let maxMetres = elevations[0];
  let minMetres = elevations[0];
  let anchor = elevations[0];

  for (let i = 1; i < elevations.length; i++) {
    const ele = elevations[i];
    if (ele > maxMetres) maxMetres = ele;
    if (ele < minMetres) minMetres = ele;
    const delta = ele - anchor;
    if (Math.abs(delta) >= ELEVATION_NOISE_THRESHOLD_METRES) {
      if (delta > 0) gainMetres += delta;
      else lossMetres += -delta;
      anchor = ele;
    }
  }
  return { gainMetres, lossMetres, maxMetres, minMetres };
}

export function parseGpx(xmlText: string): GpxParseResult {
  const points: RoutePoint[] = [];
  const elevations: (number | null)[] = [];
  POINT_TAG.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = POINT_TAG.exec(xmlText))) {
    const lat = attr(match[2], "lat");
    const lng = attr(match[2], "lon");
    if (lat === null || lng === null) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    points.push({ lat, lng });

    const eleMatch = match[3]?.match(ELE_TAG);
    const ele = eleMatch ? Number(eleMatch[1]) : NaN;
    elevations.push(Number.isFinite(ele) ? ele : null);
  }

  if (points.length < 2) {
    return {
      ok: false,
      error: "No track found in that file — check it's a .gpx export with at least two points.",
    };
  }

  // Only trust the elevation profile when every point has one — a file
  // that mixes real samples with gaps doesn't give an honest gain/loss.
  const hasFullProfile = elevations.every((e) => e !== null);
  const elevation = hasFullProfile ? computeElevationStats(elevations as number[]) : null;

  return {
    ok: true,
    points,
    name: xmlText.match(NAME_TAG)?.[1].trim() || null,
    elevation,
  };
}

// --- simplification, for a trace denser than the stored-points cap ------

/** Equirectangular projection, accurate enough at the few-mile scale a walking route covers. */
function toLocalMetres(point: RoutePoint, originLatRad: number): { x: number; y: number } {
  const EARTH_RADIUS_METRES = 6_371_008.8;
  return {
    x: EARTH_RADIUS_METRES * ((point.lng * Math.PI) / 180) * Math.cos(originLatRad),
    y: EARTH_RADIUS_METRES * ((point.lat * Math.PI) / 180),
  };
}

function perpendicularDistance(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * Douglas-Peucker: drops points that sit within `toleranceMetres` of the
 * straight line between their neighbours, keeping every real bend. A small
 * tolerance barely touches total distance — it only removes points a
 * straight line already explains.
 */
export function simplifyRoute(points: RoutePoint[], toleranceMetres: number): RoutePoint[] {
  if (points.length < 3) return points;
  const originLatRad = (points[0].lat * Math.PI) / 180;
  const xy = points.map((p) => toLocalMetres(p, originLatRad));
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop()!;
    let maxDist = 0;
    let maxIndex = -1;
    for (let i = start + 1; i < end; i++) {
      const dist = perpendicularDistance(xy[i], xy[start], xy[end]);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    if (maxDist > toleranceMetres && maxIndex !== -1) {
      keep[maxIndex] = true;
      stack.push([start, maxIndex], [maxIndex, end]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

/**
 * Simplifies just enough to fit under `limit` points, widening the
 * tolerance in steps. Falls back to plain even-stride thinning only if a
 * trace is so dense that no reasonable tolerance gets there — keeps the
 * route storable rather than rejecting the import outright.
 */
export function simplifyToLimit(points: RoutePoint[], limit: number): RoutePoint[] {
  if (points.length <= limit) return points;

  let tolerance = 2;
  let simplified = simplifyRoute(points, tolerance);
  while (simplified.length > limit && tolerance < 500) {
    tolerance *= 1.6;
    simplified = simplifyRoute(points, tolerance);
  }

  if (simplified.length <= limit) return simplified;

  const stride = Math.ceil(simplified.length / limit);
  const thinned = simplified.filter((_, i) => i % stride === 0);
  if (thinned[thinned.length - 1] !== simplified[simplified.length - 1]) {
    thinned.push(simplified[simplified.length - 1]);
  }
  return thinned;
}

/** Import-time convenience: parse, then simplify only if the trace needs it. */
export function parseGpxForRoute(
  xmlText: string,
):
  | GpxParseResult
  | {
      ok: true;
      points: RoutePoint[];
      name: string | null;
      elevation: ElevationStats | null;
      simplifiedFrom: number;
    } {
  const result = parseGpx(xmlText);
  if (!result.ok) return result;
  if (result.points.length <= MAX_ROUTE_POINTS) return result;
  const simplifiedFrom = result.points.length;
  return {
    ok: true,
    points: simplifyToLimit(result.points, MAX_ROUTE_POINTS),
    name: result.name,
    elevation: result.elevation,
    simplifiedFrom,
  };
}
