/**
 * Reads a GPX file (the standard export format from Strava, Garmin, OS
 * Maps, Komoot, Wikiloc, plotaroute.com, openrouteservice's own map
 * client, and pretty much anything else that records or plans a walk) and
 * turns it into the same RoutePoint[] shape a clicked route already uses.
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

export type GpxParseResult =
  | { ok: true; points: RoutePoint[]; name: string | null }
  | { ok: false; error: string };

const POINT_TAG = /<(?:trkpt|rtept)\b([^>]*)>/gi;
const NAME_TAG = /<name>([^<]*)<\/name>/i;

function attr(tagAttrs: string, name: string): number | null {
  const match = tagAttrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function parseGpx(xmlText: string): GpxParseResult {
  const points: RoutePoint[] = [];
  POINT_TAG.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = POINT_TAG.exec(xmlText))) {
    const lat = attr(match[1], "lat");
    const lng = attr(match[1], "lon");
    if (lat === null || lng === null) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    points.push({ lat, lng });
  }

  if (points.length < 2) {
    return {
      ok: false,
      error: "No track found in that file — check it's a .gpx export with at least two points.",
    };
  }

  return { ok: true, points, name: xmlText.match(NAME_TAG)?.[1].trim() || null };
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
): GpxParseResult | { ok: true; points: RoutePoint[]; name: string | null; simplifiedFrom: number } {
  const result = parseGpx(xmlText);
  if (!result.ok) return result;
  if (result.points.length <= MAX_ROUTE_POINTS) return result;
  const simplifiedFrom = result.points.length;
  return {
    ok: true,
    points: simplifyToLimit(result.points, MAX_ROUTE_POINTS),
    name: result.name,
    simplifiedFrom,
  };
}
