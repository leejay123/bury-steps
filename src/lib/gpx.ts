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
  | {
      ok: true;
      points: RoutePoint[];
      name: string | null;
      elevation: ElevationStats | null;
      /** One elevation sample per point in `points`, for an elevation-profile
       * chart — same length and order, so plotting it against `points`'
       * cumulative distance lines up. Null exactly when `elevation` is,
       * since both come from the same full-or-nothing profile. */
      elevationProfile: number[] | null;
    }
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

/**
 * Parses whatever came out of the database `Json` column for
 * WalkRoute.elevationProfile. Returns null rather than throwing on
 * anything malformed or the wrong length — a route whose profile somehow
 * doesn't line up with its points should just show no elevation chart, not
 * break the page.
 */
export function parseElevationProfile(value: unknown, expectedLength: number): number[] | null {
  if (!Array.isArray(value) || value.length !== expectedLength) return null;
  if (!value.every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  return value as number[];
}

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
  const fullProfile = hasFullProfile ? (elevations as number[]) : null;
  const elevation = fullProfile ? computeElevationStats(fullProfile) : null;

  return {
    ok: true,
    points,
    name: xmlText.match(NAME_TAG)?.[1].trim() || null,
    elevation,
    elevationProfile: fullProfile,
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
 * Which points Douglas-Peucker would keep at this tolerance — the same
 * length as `points`, true at every index worth keeping. Split out from
 * simplifyRoute so a parallel array (the elevation profile) can be thinned
 * by exactly the same decisions instead of recomputed independently.
 */
function keepMask(points: RoutePoint[], toleranceMetres: number): boolean[] {
  const keep = new Array(points.length).fill(false);
  if (points.length === 0) return keep;
  const originLatRad = (points[0].lat * Math.PI) / 180;
  const xy = points.map((p) => toLocalMetres(p, originLatRad));
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
  return keep;
}

/**
 * Douglas-Peucker: drops points that sit within `toleranceMetres` of the
 * straight line between their neighbours, keeping every real bend. A small
 * tolerance barely touches total distance — it only removes points a
 * straight line already explains.
 */
export function simplifyRoute(points: RoutePoint[], toleranceMetres: number): RoutePoint[] {
  if (points.length < 3) return points;
  const keep = keepMask(points, toleranceMetres);
  return points.filter((_, i) => keep[i]);
}

/**
 * Which points survive simplifyToLimit's whole strategy (widening tolerance,
 * then even-stride thinning as a last resort) — same length as `points`,
 * true at every kept index. simplifyToLimit is just this filtered by; a
 * parallel array (the elevation profile) is thinned identically by reusing
 * this mask instead of guessing at the same decisions a second time.
 */
function keepMaskToLimit(points: RoutePoint[], limit: number): boolean[] {
  if (points.length <= limit) return points.map(() => true);

  let tolerance = 2;
  let keep = keepMask(points, tolerance);
  let keptCount = keep.filter(Boolean).length;
  while (keptCount > limit && tolerance < 500) {
    tolerance *= 1.6;
    keep = keepMask(points, tolerance);
    keptCount = keep.filter(Boolean).length;
  }

  if (keptCount <= limit) return keep;

  // Falls back to even-stride thinning over what Douglas-Peucker kept, not
  // over the original points — a trace so dense that no reasonable
  // tolerance gets under the cap is rare, but this keeps the route storable
  // rather than rejecting the import outright.
  const keptIndices: number[] = [];
  keep.forEach((k, i) => {
    if (k) keptIndices.push(i);
  });
  const stride = Math.ceil(keptIndices.length / limit);
  const finalKeep = new Array(points.length).fill(false);
  keptIndices.forEach((index, position) => {
    if (position % stride === 0) finalKeep[index] = true;
  });
  finalKeep[keptIndices[keptIndices.length - 1]] = true;
  return finalKeep;
}

/**
 * Simplifies just enough to fit under `limit` points, widening the
 * tolerance in steps. Falls back to plain even-stride thinning only if a
 * trace is so dense that no reasonable tolerance gets there — keeps the
 * route storable rather than rejecting the import outright.
 */
export function simplifyToLimit(points: RoutePoint[], limit: number): RoutePoint[] {
  const keep = keepMaskToLimit(points, limit);
  return points.filter((_, i) => keep[i]);
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
      elevationProfile: number[] | null;
      simplifiedFrom: number;
    } {
  const result = parseGpx(xmlText);
  if (!result.ok) return result;
  if (result.points.length <= MAX_ROUTE_POINTS) return result;

  const simplifiedFrom = result.points.length;
  const keep = keepMaskToLimit(result.points, MAX_ROUTE_POINTS);
  return {
    ok: true,
    points: result.points.filter((_, i) => keep[i]),
    name: result.name,
    elevation: result.elevation,
    elevationProfile: result.elevationProfile
      ? result.elevationProfile.filter((_, i) => keep[i])
      : null,
    simplifiedFrom,
  };
}
