/**
 * Shared OpenRouteService/HeiGIT config for every feature built on that one
 * free key: route-routing.ts (snap drawn routes to real footpaths) and
 * geocode.ts's live route-search (Pelias geocoding). One key, one host,
 * several service paths under it — .../openrouteservice/v2/... for
 * directions, .../pelias/v1/... for geocoding — so this only resolves the
 * shared host and key; each caller appends its own service path.
 */

/** Present only when a maintainer has configured route snapping/search. */
export function orsApiKey(): string | undefined {
  return process.env.OPENROUTESERVICE_API_KEY?.trim() || undefined;
}

/**
 * HeiGIT's unified API host — a key from openrouteservice.org's current
 * dashboard authenticates against this, not the older, un-prefixed
 * api.openrouteservice.org. OPENROUTESERVICE_BASE_URL overrides it without
 * a code change, in case a given key needs a different host.
 */
export function orsBaseUrl(): string {
  return process.env.OPENROUTESERVICE_BASE_URL?.trim().replace(/\/+$/, "") || "https://api.heigit.org";
}
