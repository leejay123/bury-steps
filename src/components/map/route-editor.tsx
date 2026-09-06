"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";
import { Undo2, Trash2, MapPin, Upload, CheckCircle2, CircleAlert } from "lucide-react";
import { parseGpxForRoute, type ElevationStats } from "@/lib/gpx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  OPENTOPOMAP_ATTRIBUTION,
  OPENTOPOMAP_MAX_ZOOM,
  OPENTOPOMAP_TILE_URL,
  dotIcon,
  useLeaflet,
} from "./use-leaflet";

/**
 * Route editor — import-only. A route always comes from a GPX file (an
 * actual recorded walk, or one planned in a real route-planning tool);
 * there is deliberately no drawing one from scratch by clicking a blank
 * map, and no search box either — nothing here needs "getting your
 * bearings" first, since the file itself is where the route comes from.
 * Once a file has loaded, the map stops being read-only: the start and
 * finish dots can still be dragged to nudge them (a GPS trace often starts
 * a few metres from the real meeting point), and clicking a middle dot
 * still removes it (for a stray glitch point).
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
   * option rather than let it reject the import's point count. Carries the
   * file's own elevation gain/loss/max/min, plus a same-length-as-points
   * elevationProfile for an elevation chart, if it had a full profile. */
  onImport?: (info: {
    elevation: ElevationStats | null;
    elevationProfile: number[] | null;
    /** The file's own <desc>/<cmt>, if it had one — callers may offer to
     * fill it into Notes, but only when Notes is still empty. */
    description: string | null;
  }) => void;
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
  const [ready, setReady] = useState(false);

  // Import a GPX file — the only way to get a route onto the map. A real
  // recorded trace already has far more points than anyone would click by
  // hand, so this gets a genuinely accurate line and distance for free.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importedElevation, setImportedElevation] = useState<ElevationStats | null>(savedElevation);

  // The Leaflet drag/delete handlers are bound once, but need today's
  // points and today's onChange. A ref keeps them current without
  // rebuilding the map on every change (which would reset the zoom).
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
    leaflet
      .tileLayer(OPENTOPOMAP_TILE_URL, { attribution: OPENTOPOMAP_ATTRIBUTION, maxZoom: OPENTOPOMAP_MAX_ZOOM })
      .addTo(map);

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

  const importGpxFile = useCallback(
    async (file: File) => {
      setImporting(true);
      setImportError(null);
      setImportNotice(null);
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
        onImport?.({
          elevation: result.elevation,
          elevationProfile: result.elevationProfile,
          description: result.description,
        });

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
