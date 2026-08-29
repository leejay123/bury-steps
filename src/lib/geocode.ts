export type GeoPoint = { lat: number; lng: number };

export type PlaceHit = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "BuryStepsWalkingGroup/1.0 (https://burysteps-walkinggroup.co.uk; walking group website)";

/** Bias toward Bury without locking results to the town. */
const BURY_VIEWBOX = "-2.45,53.72,-2.15,53.48";

/**
 * Compact a typed UK postcode to the usual outward+inward form, e.g. "bl81da" → "BL8 1DA".
 * Returns null when there is nothing useful to search with.
 */
export function normalizeUkPostcode(value: string | null | undefined): string | null {
  const compact = (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.length < 5 || compact.length > 7) return null;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

/** What members see for the meeting point: wording, then postcode if there is one. */
export function meetingPointLabel(
  location?: string | null,
  postcode?: string | null,
): string {
  return [location?.trim(), postcode?.trim()].filter(Boolean).join(" · ");
}

/**
 * Nominatim finds a postcode on its own, and a street on its own. Gluing them
 * into one string ("M24 4SN, 5 Fenwick Drive, Middleton") returns nothing.
 * Postcode first when we have one — it is the strongest free pin.
 */
export function geocodeQueries(location: string, postcode?: string | null): string[] {
  const loc = location.trim();
  const pc = normalizeUkPostcode(postcode);
  const locWithTown =
    loc && !/\b(bury|manchester|lancashire|greater manchester|uk|united kingdom)\b/i.test(loc)
      ? `${loc}, Bury, UK`
      : loc;

  const queries: string[] = [];
  if (pc) queries.push(pc);
  if (locWithTown && locWithTown !== pc) queries.push(locWithTown);
  return queries;
}

/** The first lookup we will try — a postcode if present, otherwise the place name. */
export function geocodeQuery(location: string, postcode?: string | null): string {
  return geocodeQueries(location, postcode)[0] ?? "";
}

function parsePoint(lat: unknown, lon: unknown): GeoPoint | null {
  const parsedLat = typeof lat === "string" ? Number(lat) : typeof lat === "number" ? lat : NaN;
  const parsedLng = typeof lon === "string" ? Number(lon) : typeof lon === "number" ? lon : NaN;
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null;
  return { lat: parsedLat, lng: parsedLng };
}

export function parseFormPoint(lat: unknown, lng: unknown): GeoPoint | null {
  if (typeof lat !== "string" && typeof lat !== "number") return null;
  if (typeof lng !== "string" && typeof lng !== "number") return null;
  if (lat === "" || lng === "") return null;
  return parsePoint(lat, lng);
}

function looksLikePostcode(q: string): boolean {
  return normalizeUkPostcode(q) != null;
}

async function nominatimSearch(
  q: string,
  limit: number,
  biasBury: boolean,
): Promise<PlaceHit[]> {
  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("countrycodes", "gb");
  if (biasBury) url.searchParams.set("viewbox", BURY_VIEWBOX);
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-GB",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];

  const hits: PlaceHit[] = [];
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const hit = row as { lat?: unknown; lon?: unknown; display_name?: unknown };
    const point = parsePoint(hit.lat, hit.lon);
    const label = typeof hit.display_name === "string" ? hit.display_name : "";
    if (!point || !label) continue;
    hits.push({
      id: `p${hits.length}`,
      label,
      lat: point.lat,
      lng: point.lng,
    });
  }
  return hits;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Up to five matches so an organiser can pick the right pin. */
export async function searchPlaces(
  location: string,
  postcode?: string | null,
): Promise<PlaceHit[]> {
  const queries = geocodeQueries(location, postcode);
  const merged: PlaceHit[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < queries.length; i++) {
    if (merged.length >= 5) break;
    if (i > 0) await wait(1100);
    let hits: PlaceHit[] = [];
    try {
      hits = await nominatimSearch(queries[i], 5, !looksLikePostcode(queries[i]));
    } catch {
      hits = [];
    }
    for (const hit of hits) {
      const key = `${hit.lat.toFixed(5)},${hit.lng.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        id: `p${merged.length}`,
        label: hit.label,
        lat: hit.lat,
        lng: hit.lng,
      });
      if (merged.length >= 5) return merged;
    }
    // A postcode hit is enough — don't wait a second to also search the street.
    if (merged.length > 0) return merged;
  }
  return merged;
}

/** Look up a meeting point. No API key. Returns null on miss or failure. */
export async function geocodeLocation(
  location: string,
  postcode?: string | null,
): Promise<GeoPoint | null> {
  const hits = await searchPlaces(location, postcode);
  if (hits.length === 0) return null;
  return { lat: hits[0].lat, lng: hits[0].lng };
}

export async function geocodeFields(
  location: string | null | undefined,
  postcode?: string | null,
): Promise<{ latitude: number | null; longitude: number | null }> {
  if (!location && !normalizeUkPostcode(postcode) && !postcode?.trim()) {
    return { latitude: null, longitude: null };
  }
  const point = await geocodeLocation(location ?? "", postcode);
  if (!point) return { latitude: null, longitude: null };
  return { latitude: point.lat, longitude: point.lng };
}
