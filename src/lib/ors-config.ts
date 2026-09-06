/**
 * Shared OpenRouteService/HeiGIT config for route-routing.ts (snapping a
 * route's points onto real footpaths). One key, one host — this only
 * resolves the shared host and key; the caller appends its own service
 * path (.../openrouteservice/v2/... for directions).
 */

/** Present only when a maintainer has configured route snapping. */
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
