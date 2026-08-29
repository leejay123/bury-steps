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
 * Nominatim finds "Car park, Woodhill Road" more reliably if the town is on
 * the query. Organisers often type a local landmark without "Bury".
 * A postcode, when present, goes first — it is the strongest free pin.
 */
export function geocodeQuery(location: string, postcode?: string | null): string {
  const loc = location.trim();
  const pc = normalizeUkPostcode(postcode) ?? postcode?.trim().toUpperCase() ?? "";
  const locWithTown =
    loc && !/\b(bury|manchester|lancashire|greater manchester|uk|united kingdom)\b/i.test(loc)
      ? `${loc}, Bury, UK`
      : loc;

  return [pc, locWithTown].filter(Boolean).join(", ");
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

async function nominatimSearch(q: string, limit: number): Promise<PlaceHit[]> {
  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("countrycodes", "gb");
  url.searchParams.set("viewbox", BURY_VIEWBOX);
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-GB",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(3500),
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
      id: `${point.lat},${point.lng}`,
      label,
      lat: point.lat,
      lng: point.lng,
    });
  }
  return hits;
}

/** Up to five matches so an organiser can pick the right pin. One request per search. */
export async function searchPlaces(
  location: string,
  postcode?: string | null,
): Promise<PlaceHit[]> {
  const q = geocodeQuery(location, postcode);
  if (!q) return [];
  try {
    return await nominatimSearch(q, 5);
  } catch {
    return [];
  }
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
