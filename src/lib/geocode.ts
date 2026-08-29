export type GeoPoint = { lat: number; lng: number };

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "BuryStepsWalkingGroup/1.0 (https://burysteps-walkinggroup.co.uk; walking group website)";

/**
 * Nominatim finds "Car park, Woodhill Road" more reliably if the town is on
 * the query. Organisers often type a local landmark without "Bury".
 */
export function geocodeQuery(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) return "";
  if (/\b(bury|manchester|lancashire|greater manchester|uk|united kingdom)\b/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}, Bury, UK`;
}

function parsePoint(lat: unknown, lon: unknown): GeoPoint | null {
  const parsedLat = typeof lat === "string" ? Number(lat) : typeof lat === "number" ? lat : NaN;
  const parsedLng = typeof lon === "string" ? Number(lon) : typeof lon === "number" ? lon : NaN;
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null;
  return { lat: parsedLat, lng: parsedLng };
}

/** Look up a meeting point with OpenStreetMap. No API key. Returns null on miss or failure. */
export async function geocodeLocation(location: string): Promise<GeoPoint | null> {
  const q = geocodeQuery(location);
  if (!q) return null;

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "gb");

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en-GB",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const hit = data[0] as { lat?: unknown; lon?: unknown };
    return parsePoint(hit.lat, hit.lon);
  } catch {
    return null;
  }
}

export async function geocodeFields(
  location: string | null | undefined,
): Promise<{ latitude: number | null; longitude: number | null }> {
  if (!location) return { latitude: null, longitude: null };
  const point = await geocodeLocation(location);
  if (!point) return { latitude: null, longitude: null };
  return { latitude: point.lat, longitude: point.lng };
}
