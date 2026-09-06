/**
 * MapTiler Cloud config for the route map's 3D terrain view
 * (route-map-view-impl.tsx). Unlike OPENROUTESERVICE_API_KEY (used only in
 * server actions, never sent to the browser), this key is fetched directly
 * by MapLibre running in the browser — it necessarily appears in plain
 * sight in every map tile request, so it uses the NEXT_PUBLIC_ prefix Next
 * bakes into the client bundle rather than a server-only env var. This is
 * how MapTiler's own key is designed to work: it isn't a secret, it's an
 * identifier they expect to see in page source, and their dashboard offers
 * domain restrictions to stop it being reused elsewhere if that matters.
 *
 * Chosen after OpenFreeMap (a free, keyless hobby project run on two bare
 * servers with no CDN) proved unreliable in practice — MapTiler's free
 * tier (100k map loads/month, no card) is backed by real CDN
 * infrastructure, and one key covers both the map style and its terrain
 * data instead of juggling two separate free services.
 */

const STYLE_ID = "outdoor";

export function maptilerApiKey(): string | null {
  return process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() || null;
}

export function maptilerStyleUrl(key: string): string {
  return `https://api.maptiler.com/maps/${STYLE_ID}/style.json?key=${key}`;
}

/** TileJSON — lets MapLibre read the real tile URL template, zoom range,
 * and attribution from MapTiler itself rather than guessing at them. */
export function maptilerTerrainUrl(key: string): string {
  return `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${key}`;
}
