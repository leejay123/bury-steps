"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import { Undo2, Trash2, MapPin, Search } from "lucide-react";
import { searchWalkPlaces } from "@/server/actions";
import type { PlaceHit } from "@/lib/geocode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MAX_ROUTE_POINTS,
  type RoutePoint,
  formatMiles,
  formatWalkEstimate,
  isCircular,
  routeDistanceMetres,
} from "@/lib/route-geometry";
import {
  DEFAULT_CENTRE,
  DEFAULT_ZOOM,
  OSM_ATTRIBUTION,
  OSM_TILE_URL,
  dotIcon,
  useLeaflet,
} from "./use-leaflet";

/** Street-level enough to start clicking a route without more zooming. */
const SEARCH_ZOOM = 15;

/**
 * Click-to-draw route editor.
 *
 * Deliberately has no routing service behind it: the line runs straight
 * between clicks, so an organiser clicks along the bends of a path rather
 * than just its ends. That keeps the whole feature free of API keys,
 * accounts and rate limits. The point count is shown next to the distance
 * so it is obvious when a route has been drawn too coarsely to measure
 * properly.
 *
 * The "find a place" box above the map does not draw anything — it only
 * recentres the view, reusing the same free Nominatim lookup the meeting
 * point field already calls (searchWalkPlaces), so someone unfamiliar with
 * reading a map isn't stuck guessing where their usual route even is.
 */
export function RouteEditor({
  value,
  onChange,
  startNear,
  className,
}: {
  value: RoutePoint[];
  onChange: (points: RoutePoint[]) => void;
  /** Meeting point of the walk, if known — where the map opens. */
  startNear?: { lat: number; lng: number } | null;
  className?: string;
}) {
  const leaflet = useLeaflet();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const layerRef = useRef<LeafletNS.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  // "Find a place" — jumps the map to a typed place or postcode before the
  // organiser starts clicking. It never touches the route itself, so it
  // reuses the same free, no-key Nominatim lookup the meeting point field
  // already uses (searchWalkPlaces), just to recentre the view.
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hits, setHits] = useState<PlaceHit[] | null>(null);

  // The Leaflet click handler is bound once, but needs today's points and
  // today's onChange. A ref keeps it current without rebuilding the map on
  // every click (which would reset the zoom mid-draw).
  const stateRef = useRef({ value, onChange });
  useEffect(() => {
    stateRef.current = { value, onChange };
  });

  const distance = useMemo(() => routeDistanceMetres(value), [value]);
  const atLimit = value.length >= MAX_ROUTE_POINTS;

  // --- map setup, once ------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!leaflet || !container) return;

    const centre: [number, number] = startNear
      ? [startNear.lat, startNear.lng]
      : value.length > 0
        ? [value[0].lat, value[0].lng]
        : DEFAULT_CENTRE;

    const map = leaflet.map(container, { scrollWheelZoom: true }).setView(centre, DEFAULT_ZOOM);
    leaflet.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);

    map.on("click", (event: LeafletNS.LeafletMouseEvent) => {
      const { value: points, onChange: emit } = stateRef.current;
      if (points.length >= MAX_ROUTE_POINTS) return;
      emit([...points, { lat: event.latlng.lat, lng: event.latlng.lng }]);
    });

    mapRef.current = map;
    layerRef.current = leaflet.layerGroup().addTo(map);
    setReady(true);

    const settle = window.setTimeout(() => map.invalidateSize(), 120);
    return () => {
      window.clearTimeout(settle);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      setReady(false);
    };
    // Built once. Later prop changes are handled by the redraw effect below,
    // so the organiser never loses their pan and zoom part-way through.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaflet]);

  // --- redraw whenever the points change ------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!leaflet || !map || !layer || !ready) return;

    layer.clearLayers();
    if (value.length === 0) return;

    const latLngs = value.map((p) => [p.lat, p.lng] as [number, number]);
    leaflet.polyline(latLngs, { weight: 5, opacity: 0.9, color: "#2563eb" }).addTo(layer);

    value.forEach((point, index) => {
      const isFirst = index === 0;
      const isLast = index === value.length - 1 && value.length > 1;

      if (isFirst || isLast) {
        leaflet
          .marker([point.lat, point.lng], {
            icon: dotIcon(leaflet, isFirst ? "start" : "finish"),
            draggable: true,
          })
          .on("dragend", (event: LeafletNS.DragEndEvent) => {
            const { lat, lng } = (event.target as LeafletNS.Marker).getLatLng();
            const { value: points, onChange: emit } = stateRef.current;
            emit(points.map((p, i) => (i === index ? { lat, lng } : p)));
          })
          .addTo(layer);
        return;
      }

      // Middle points are small handles: drag to nudge, click to delete.
      // Deleting a mis-click without undoing everything after it is the
      // single most-asked-for thing in a tool like this.
      leaflet
        .circleMarker([point.lat, point.lng], {
          radius: 6,
          weight: 2,
          color: "#fff",
          fillColor: "#2563eb",
          fillOpacity: 1,
        })
        .bindTooltip("Click to remove this point", { direction: "top" })
        .on("click", (event: LeafletNS.LeafletMouseEvent) => {
          // Otherwise the map's own click handler adds a point where we
          // just removed one.
          leaflet.DomEvent.stopPropagation(event);
          const { value: points, onChange: emit } = stateRef.current;
          emit(points.filter((_, i) => i !== index));
        })
        .addTo(layer);
    });
  }, [leaflet, value, ready]);

  const undo = useCallback(() => {
    onChange(value.slice(0, -1));
  }, [onChange, value]);

  const clear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const recentre = useCallback(() => {
    const map = mapRef.current;
    if (!map || !leaflet || value.length === 0) return;
    map.fitBounds(leaflet.polyline(value.map((p) => [p.lat, p.lng] as [number, number])).getBounds(), {
      padding: [24, 24],
    });
  }, [leaflet, value]);

  const jumpTo = useCallback((place: PlaceHit) => {
    mapRef.current?.flyTo([place.lat, place.lng], SEARCH_ZOOM);
    setHits(null);
    setSearchError(null);
  }, []);

  const findPlace = useCallback(async () => {
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setSearchError(null);
    setHits(null);
    try {
      // Same free-text field for both params: a postcode is recognised and
      // tried first, otherwise it's searched as a place name — see
      // geocodeQueries in src/lib/geocode.ts.
      const result = await searchWalkPlaces(q, q);
      if (!result.ok) {
        setSearchError(result.error);
        return;
      }
      if (result.places.length === 1) {
        jumpTo(result.places[0]);
      } else {
        setHits(result.places);
      }
    } catch {
      setSearchError("Could not search right now. Try again in a moment.");
    } finally {
      setSearching(false);
    }
  }, [jumpTo, query, searching]);

  const onSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      void findPlace();
    },
    [findPlace],
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label="Find a place, postcode, or address on the map"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Not sure where you are? Search a place, postcode, or address"
            value={query}
          />
          <Button
            disabled={searching || !query.trim()}
            onClick={() => void findPlace()}
            size="sm"
            type="button"
            variant="outline"
          >
            <Search className="size-4" />
            {searching ? "Searching…" : "Find"}
          </Button>
        </div>
        {searchError ? <p className="text-xs text-destructive">{searchError}</p> : null}
        {hits && hits.length > 0 ? (
          <div className="flex flex-col gap-0.5 rounded-lg border bg-muted/40 p-1 text-sm">
            <p className="px-2 pt-1 text-xs text-muted-foreground">Which one?</p>
            {hits.map((hit) => (
              <button
                className="truncate rounded px-2 py-1.5 text-left hover:bg-muted"
                key={hit.id}
                onClick={() => jumpTo(hit)}
                type="button"
              >
                {hit.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="relative h-[22rem] w-full bg-muted sm:h-[28rem]" ref={containerRef}>
          {!leaflet ? <div aria-hidden className="absolute inset-0 animate-pulse bg-muted" /> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={value.length === 0} onClick={undo} size="sm" type="button" variant="outline">
          <Undo2 className="size-4" />
          Undo last point
        </Button>
        <Button disabled={value.length === 0} onClick={clear} size="sm" type="button" variant="outline">
          <Trash2 className="size-4" />
          Start again
        </Button>
        <Button disabled={value.length === 0} onClick={recentre} size="sm" type="button" variant="ghost">
          <MapPin className="size-4" />
          Fit to route
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/40 p-3 text-sm">
        {value.length === 0 ? (
          <p className="text-muted-foreground">
            Click the map where the walk starts, then keep clicking along the path. Follow the
            bends — the line runs straight between your clicks, so a curvy path clicked only at
            both ends will measure shorter than it really is.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              {formatMiles(distance)}
              <span className="text-muted-foreground font-normal">
                {" · "}
                {formatWalkEstimate(distance)}
                {isCircular(value) ? " · circular" : null}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {value.length} {value.length === 1 ? "point" : "points"} clicked
              {value.length < 8
                ? " — add more along the bends for an accurate distance."
                : null}
              {atLimit ? ` — that's the maximum of ${MAX_ROUTE_POINTS}.` : null}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag the green or red dot to move the start or finish. Click any blue dot to remove it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RouteEditor;
