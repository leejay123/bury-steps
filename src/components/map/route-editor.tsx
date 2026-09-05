"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import { Undo2, Trash2, MapPin, Search, LocateFixed, Upload, CheckCircle2, CircleAlert } from "lucide-react";
import { searchRoutePlaces } from "@/server/actions";
import type { PlaceHit } from "@/lib/geocode";
import { parseGpxForRoute, type ElevationStats } from "@/lib/gpx";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

/** Street-level enough to see an imported route without more zooming. */
const SEARCH_ZOOM = 15;

/**
 * Route editor — import-only. A route always comes from a GPX file (an
 * actual recorded walk, or one planned in a real route-planning tool);
 * there is deliberately no drawing one from scratch by clicking a blank
 * map. Once a file has loaded, the map stops being read-only: the start
 * and finish dots can still be dragged to nudge them (a GPS trace often
 * starts a few metres from the real meeting point), and clicking a middle
 * dot still removes it (for a stray glitch point), matching how a
 * click-drawn route always worked — it's only adding a brand new point
 * from nothing that's gone.
 *
 * The "find a place" box above the map does not touch the route at all —
 * it only recentres the view and drops a temporary marker there, useful
 * for getting your bearings before or after importing. Live suggestions
 * come from searchRoutePlaces (HeiGIT's Pelias geocoder when a
 * route-snapping key is configured, the same free Nominatim lookup the
 * meeting-point field uses otherwise). "Use my location" is a single
 * one-off GPS read on tap — not tracking, nothing stored, nothing sent
 * anywhere.
 */
export function RouteEditor({
  value,
  onChange,
  onImport,
  elevation: savedElevation = null,
  startNear,
  className,
}: {
  value: RoutePoint[];
  onChange: (points: RoutePoint[]) => void;
  /** Fires right after a successful GPX import — a real trace is already
   * the true path, so callers should turn off any "snap to footpaths"
   * option rather than let it reject the import's point count. Carries
   * the file's own elevation gain/loss/max/min, if it had a full profile. */
  onImport?: (info: { elevation: ElevationStats | null }) => void;
  /** Elevation already saved on this route from an earlier import, if any —
   * shown from the start so reopening an existing route to edit it doesn't
   * look like the gain/loss figures were never there. A fresh import
   * within this session overwrites it the same way it overwrites points. */
  elevation?: ElevationStats | null;
  /** Meeting point of the walk, if known — where the map opens. */
  startNear?: { lat: number; lng: number } | null;
  className?: string;
}) {
  const leaflet = useLeaflet();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const layerRef = useRef<LeafletNS.LayerGroup | null>(null);
  const searchMarkerRef = useRef<LeafletNS.CircleMarker | null>(null);
  const [ready, setReady] = useState(false);

  // "Find a place" — jumps the map to a typed place, postcode, or address
  // before the organiser starts clicking. It never touches the route
  // itself; it only recentres the view and drops a temporary marker.
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hits, setHits] = useState<PlaceHit[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const skipNextSearchRef = useRef(false);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Import a GPX file — an alternative to clicking. A real recorded trace
  // already has far more points than anyone would click by hand, so this
  // gets a genuinely accurate line and distance for free.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importedElevation, setImportedElevation] = useState<ElevationStats | null>(savedElevation);

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

    // Clicking the map no longer adds a point — a route has to come from an
    // imported file, never drawn from scratch (see the doc comment above).
    // A click still clears a stray "you searched here" marker, since it
    // means the organiser has moved on to looking at the map itself.
    map.on("click", () => {
      searchMarkerRef.current?.remove();
      searchMarkerRef.current = null;
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
      searchMarkerRef.current = null;
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
    setImportedElevation(null);
    setImportNotice(null);
  }, [onChange]);

  const fitBoundsToPoints = useCallback(
    (points: RoutePoint[]) => {
      const map = mapRef.current;
      if (!map || !leaflet || points.length === 0) return;
      map.fitBounds(leaflet.polyline(points.map((p) => [p.lat, p.lng] as [number, number])).getBounds(), {
        padding: [24, 24],
      });
    },
    [leaflet],
  );

  const recentre = useCallback(() => {
    fitBoundsToPoints(value);
  }, [fitBoundsToPoints, value]);

  // Recentres the map on any found point and drops (or moves) a temporary
  // marker there — search never adds a route point, this just shows where
  // "here" actually is. Cleared the moment real drawing starts (the map's
  // click handler above).
  const jumpTo = useCallback(
    (place: { lat: number; lng: number }) => {
      const map = mapRef.current;
      if (!leaflet || !map) return;
      map.flyTo([place.lat, place.lng], SEARCH_ZOOM);
      if (searchMarkerRef.current) {
        searchMarkerRef.current.setLatLng([place.lat, place.lng]);
      } else {
        searchMarkerRef.current = leaflet
          .circleMarker([place.lat, place.lng], {
            radius: 8,
            weight: 2,
            color: "#fff",
            fillColor: "#7c3aed",
            fillOpacity: 0.9,
          })
          .bindTooltip("Searched location", { direction: "top" })
          .addTo(map);
      }
    },
    [leaflet],
  );

  const selectHit = useCallback(
    (hit: PlaceHit) => {
      skipNextSearchRef.current = true;
      setQuery(hit.label);
      setHits(null);
      setActiveIndex(-1);
      setSearchError(null);
      jumpTo(hit);
    },
    [jumpTo],
  );

  const runSearch = useCallback(async (q: string) => {
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const result = await searchRoutePlaces(q);
      if (!result.ok) {
        setHits(null);
        setSearchError(result.error);
        return;
      }
      setHits(result.places);
      setActiveIndex(-1);
    } catch {
      setHits(null);
      setSearchError("Could not search right now. Try again in a moment.");
    } finally {
      setSearching(false);
    }
  }, []);

  // Below three characters there isn't enough to usefully match on — clear
  // any stale list the instant that becomes true. A pure state adjustment
  // reacting to a prop-like value (query) changing, so this runs during
  // render via useResetOnChange rather than a useEffect (see its own doc
  // comment on why: it lands in the same render pass instead of committing
  // a stale frame first, and avoids react-hooks/set-state-in-effect).
  const tooShortToSearch = query.trim().length < 3;
  useResetOnChange([tooShortToSearch], () => {
    if (tooShortToSearch) {
      setHits(null);
      setSearchError(null);
    }
  });

  // Live suggestions as you type, debounced so it's a handful of requests
  // per search rather than one per keystroke.
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 3) return;
    const timer = window.setTimeout(() => void runSearch(q), 350);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  const onSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (hits && hits.length > 0) setActiveIndex((i) => (i + 1) % hits.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (hits && hits.length > 0) setActiveIndex((i) => (i <= 0 ? hits.length - 1 : i - 1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (hits && hits.length > 0) selectHit(hits[activeIndex >= 0 ? activeIndex : 0]);
        else void runSearch(query.trim());
      } else if (event.key === "Escape") {
        setHits(null);
        setActiveIndex(-1);
      }
    },
    [activeIndex, hits, query, runSearch, selectHit],
  );

  const useMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationError("Your browser cannot share its location.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        jumpTo({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        setLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Location access was blocked — check your browser's site settings."
            : "Could not get your location. Try again in a moment.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    );
  }, [jumpTo]);

  const importGpxFile = useCallback(
    async (file: File) => {
      setImporting(true);
      setImportError(null);
      setImportNotice(null);
      // Cleared on import so an earlier search's marker doesn't linger next
      // to a route that no longer starts anywhere near it.
      searchMarkerRef.current?.remove();
      searchMarkerRef.current = null;
      try {
        const text = await file.text();
        const result = parseGpxForRoute(text);
        if (!result.ok) {
          setImportError(result.error);
          return;
        }
        onChange(result.points);
        fitBoundsToPoints(result.points);
        setImportedElevation(result.elevation);
        onImport?.({ elevation: result.elevation });

        // Always confirm the import happened — this is the only feedback an
        // organiser gets that their file actually loaded, so it isn't
        // conditional on anything (unlike the old "simplified" note, which
        // only appeared when thinning kicked in).
        const pointsLabel = `${result.points.length.toLocaleString()} ${result.points.length === 1 ? "point" : "points"}`;
        const elevationLabel = result.elevation
          ? `, ${Math.round(result.elevation.gainMetres)} m of ascent`
          : "";
        setImportNotice(
          "simplifiedFrom" in result
            ? `Imported “${file.name}” — that trace had ${result.simplifiedFrom.toLocaleString()} points, simplified to ${pointsLabel}${elevationLabel}. The shape and distance barely change.`
            : `Imported “${file.name}” — ${pointsLabel}${elevationLabel}.`,
        );
      } catch {
        setImportError("That file could not be read. Check it's a .gpx export.");
      } finally {
        setImporting(false);
      }
    },
    [fitBoundsToPoints, onChange, onImport],
  );

  const onGpxFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset so choosing the same file again still fires a change event.
      event.target.value = "";
      if (file) void importGpxFile(file);
    },
    [importGpxFile],
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col items-start gap-2 rounded-lg border bg-muted/40 p-3">
        <p className="text-sm">
          Import a GPX file to add this route — a walk recorded in Strava, OS Maps, Komoot, a GPS
          watch, or planned in a tool like plotaroute.com or openrouteservice&apos;s own map.
        </p>
        <input
          accept=".gpx,application/gpx+xml"
          className="hidden"
          onChange={onGpxFileChange}
          ref={fileInputRef}
          type="file"
        />
        <Button disabled={importing} onClick={() => fileInputRef.current?.click()} type="button">
          <Upload className="size-4" />
          {importing ? "Reading…" : "Import a GPX file"}
        </Button>
        {importError ? (
          <Alert className="py-2" variant="destructive">
            <CircleAlert />
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        ) : null}
        {importNotice ? (
          <Alert className="py-2" variant="success">
            <CheckCircle2 />
            <AlertDescription>{importNotice}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Input
              aria-activedescendant={activeIndex >= 0 ? `route-search-option-${activeIndex}` : undefined}
              aria-autocomplete="list"
              aria-controls="route-search-listbox"
              aria-expanded={Boolean(hits && hits.length > 0)}
              aria-label="Find a place, postcode, or address on the map"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Get your bearings: search a place, postcode, or address"
              role="combobox"
              value={query}
            />
            {hits && hits.length > 0 ? (
              <div
                className="absolute z-10 mt-1 flex w-full flex-col gap-0.5 rounded-lg border bg-popover p-1 text-sm shadow-md"
                id="route-search-listbox"
                role="listbox"
              >
                {hits.map((hit, index) => (
                  <button
                    aria-selected={index === activeIndex}
                    className={cn(
                      "truncate rounded px-2 py-1.5 text-left hover:bg-muted",
                      index === activeIndex && "bg-muted",
                    )}
                    id={`route-search-option-${index}`}
                    key={hit.id}
                    onClick={() => selectHit(hit)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    type="button"
                  >
                    {hit.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              disabled={searching || !query.trim()}
              onClick={() => void runSearch(query.trim())}
              size="sm"
              type="button"
              variant="outline"
            >
              <Search className="size-4" />
              {searching ? "Searching…" : "Find"}
            </Button>
            <Button disabled={locating} onClick={useMyLocation} size="sm" type="button" variant="ghost">
              <LocateFixed className="size-4" />
              {locating ? "Locating…" : "Use my location"}
            </Button>
          </div>
        </div>
        {searchError ? <p className="text-xs text-destructive">{searchError}</p> : null}
        {locationError ? <p className="text-xs text-destructive">{locationError}</p> : null}
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
            Import a GPX file above to add a route — there&apos;s no drawing one from scratch.
            Once it&apos;s loaded you can drag the green or red dot to nudge the start or finish,
            or click any blue dot to remove it.
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
              {value.length} {value.length === 1 ? "point" : "points"}
              {atLimit ? ` — that's the maximum of ${MAX_ROUTE_POINTS}.` : null}
            </p>
            {importedElevation ? (
              <p className="text-xs text-muted-foreground">
                Elevation: {Math.round(importedElevation.gainMetres)} m up,{" "}
                {Math.round(importedElevation.lossMetres)} m down (from{" "}
                {Math.round(importedElevation.minMetres)} m to{" "}
                {Math.round(importedElevation.maxMetres)} m)
              </p>
            ) : null}
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
