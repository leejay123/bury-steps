import type { GeoPoint } from "./geocode";

/** OpenStreetMap embed around a pin. Free, no API key. */
export function osmEmbedUrl(point: GeoPoint): string {
  const pad = 0.008;
  const bbox = [point.lng - pad, point.lat - pad, point.lng + pad, point.lat + pad].join(",");
  const url = new URL("https://www.openstreetmap.org/export/embed.html");
  url.searchParams.set("bbox", bbox);
  url.searchParams.set("layer", "mapnik");
  url.searchParams.set("marker", `${point.lat},${point.lng}`);
  return url.toString();
}

export function osmViewUrl(point: GeoPoint): string {
  return `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=16/${point.lat}/${point.lng}`;
}

/** Opens Google Maps with turn-by-turn directions to the meeting point. Free, no key. */
export function googleDirectionsUrl(location: string, point?: GeoPoint | null): string {
  const destination = point ? `${point.lat},${point.lng}` : location;
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", destination);
  return url.toString();
}

/** Opens Apple Maps directions. Free, no key. */
export function appleMapsUrl(location: string, point?: GeoPoint | null): string {
  const url = new URL("https://maps.apple.com/");
  if (point) {
    url.searchParams.set("daddr", `${point.lat},${point.lng}`);
    url.searchParams.set("q", location);
  } else {
    url.searchParams.set("daddr", location);
  }
  return url.toString();
}
