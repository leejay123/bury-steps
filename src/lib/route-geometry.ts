/**
 * A drawn walking route is just an ordered list of points. Nothing is
 * fetched from a routing service and nothing is tracked from anyone's
 * phone — an organiser clicks the path on a map and we store what they
 * clicked. Distance is worked out here from those points.
 *
 * Consequence worth knowing: the line runs straight between consecutive
 * clicks, so a bendy path clicked only at its ends measures short. More
 * clicks, closer to the truth. `routePointCount` is surfaced in the editor
 * so an organiser can see when a route is too coarse.
 */

export type RoutePoint = { lat: number; lng: number };

/** Below this a "route" is a single dot, not a path. */
export const MIN_ROUTE_POINTS = 2;

/**
 * Enough for a detailed several-mile route clicked bend by bend, low
 * enough that one row stays small and the JSON parses instantly. Roughly
 * 40 KB at the stored precision.
 */
export const MAX_ROUTE_POINTS = 2000;

const EARTH_RADIUS_METRES = 6_371_008.8;
const METRES_PER_MILE = 1609.344;

/**
 * ~1.1 cm at UK latitudes. Far finer than anyone can click, and it keeps
 * the stored JSON from carrying 15 meaningless decimal places per point.
 */
const STORED_DECIMALS = 7;

function roundCoord(value: number): number {
  return Number(value.toFixed(STORED_DECIMALS));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two points, in metres. */
export function haversineMetres(a: RoutePoint, b: RoutePoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total length of the drawn line, in metres. Zero for fewer than 2 points. */
export function routeDistanceMetres(points: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineMetres(points[i - 1], points[i]);
  }
  return total;
}

export function metresToMiles(metres: number): number {
  return metres / METRES_PER_MILE;
}

/**
 * Miles to one decimal place — the unit the group actually talks in.
 * Under a tenth of a mile reads as "under 0.1 miles" rather than "0.0".
 */
export function formatMiles(metres: number): string {
  const miles = metresToMiles(metres);
  if (miles > 0 && miles < 0.05) return "under 0.1 miles";
  const rounded = miles.toFixed(1);
  return `${rounded} ${rounded === "1.0" ? "mile" : "miles"}`;
}

/** Rough walking time at a steady group pace (3 km/h — this is a walking
 * group with a range of abilities, not a hiking club). Advisory only. */
export function estimateWalkMinutes(metres: number): number {
  return Math.round((metres / 3000) * 60);
}

export function formatWalkEstimate(metres: number): string {
  // Rounded to the nearest 5 minutes below an hour, then to the nearest
  // quarter hour above it — this is a "roughly how long" line, and false
  // precision ("about 83 minutes") would invite complaints when the group
  // stops to chat.
  const mins = estimateWalkMinutes(metres);
  if (mins < 60) return `about ${Math.max(5, Math.round(mins / 5) * 5)} minutes`;

  const quarters = Math.round(mins / 15);
  const hours = Math.floor(quarters / 4);
  const rest = (quarters % 4) * 15;
  const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return rest === 0 ? `about ${hourLabel}` : `about ${hourLabel} ${rest} minutes`;
}

function isFinitePoint(value: unknown): value is RoutePoint {
  if (typeof value !== "object" || value === null) return false;
  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Parses whatever came out of the database `Json` column or off the wire.
 * Returns `[]` rather than throwing: a route that somehow stored badly
 * should make the map disappear, not 500 the walk page.
 */
export function parseRoutePoints(value: unknown): RoutePoint[] {
  if (!Array.isArray(value)) return [];
  const points: RoutePoint[] = [];
  for (const entry of value) {
    if (!isFinitePoint(entry)) return [];
    points.push({ lat: roundCoord(entry.lat), lng: roundCoord(entry.lng) });
    if (points.length > MAX_ROUTE_POINTS) return [];
  }
  return points;
}

/**
 * Same parse, but for submitted data where a bad payload is a real error
 * the organiser should see rather than something to swallow.
 */
export function validateRoutePoints(
  value: unknown,
): { ok: true; points: RoutePoint[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) {
    return { ok: false, error: "That route could not be read. Try drawing it again." };
  }
  if (value.length < MIN_ROUTE_POINTS) {
    return { ok: false, error: "Click at least two points on the map to draw a route." };
  }
  if (value.length > MAX_ROUTE_POINTS) {
    return { ok: false, error: `A route can have up to ${MAX_ROUTE_POINTS} points.` };
  }
  const points = parseRoutePoints(value);
  if (points.length !== value.length) {
    return { ok: false, error: "That route could not be read. Try drawing it again." };
  }
  return { ok: true, points };
}

export function routePointCount(points: RoutePoint[]): number {
  return points.length;
}

/** Bounding box for fitting the map to the route. Null when there's nothing to fit. */
export function routeBounds(
  points: RoutePoint[],
): { south: number; west: number; north: number; east: number } | null {
  if (points.length === 0) return null;
  let south = points[0].lat;
  let north = points[0].lat;
  let west = points[0].lng;
  let east = points[0].lng;
  for (const p of points) {
    if (p.lat < south) south = p.lat;
    if (p.lat > north) north = p.lat;
    if (p.lng < west) west = p.lng;
    if (p.lng > east) east = p.lng;
  }
  return { south, west, north, east };
}

/** True when the finish is within ~40 m of the start — a loop, worth saying. */
export function isCircular(points: RoutePoint[]): boolean {
  if (points.length < 3) return false;
  return haversineMetres(points[0], points[points.length - 1]) < 40;
}
