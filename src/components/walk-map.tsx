"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GeoPoint } from "@/lib/geocode";
import {
  appleMapsUrl,
  googleDirectionsUrl,
  osmEmbedUrl,
  osmViewUrl,
} from "@/lib/maps";
import { cn } from "@/lib/utils";

/**
 * How the meeting-point map looks. Walk pages use the card; the walk page
 * designer's Map block sets the rest (MapLookProvider) — a flat map that
 * runs edge to edge, the map alone, the details floating over the map, or
 * side by side — and where the directions buttons go, or none.
 */
export type MapLook = {
  look?: "card" | "flat" | "bare" | "overlay" | "split";
  buttons?: "below" | "above" | "over" | "none";
  height?: "short" | "medium" | "tall";
  showTitle?: boolean;
  showNote?: boolean;
};
const DEFAULT_LOOK: Required<MapLook> = {
  look: "card",
  buttons: "below",
  height: "medium",
  showTitle: true,
  showNote: true,
};
/** Inside an edge-to-edge designer block, lose the rounded corners and side borders. */
const BLEED = "in-data-[bleed]:rounded-none in-data-[bleed]:border-x-0";
const MapLookContext = createContext<MapLook | null>(null);

export function MapLookProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: MapLook;
}) {
  return (
    <MapLookContext.Provider value={value}>{children}</MapLookContext.Provider>
  );
}

/** Get directions and Apple Maps, for the map or to place on their own. */
export function DirectionsButtons({
  className,
  location,
  point = null,
}: {
  className?: string;
  location: string;
  point?: GeoPoint | null;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:flex", className)}>
      <Button asChild size="sm">
        <a
          href={googleDirectionsUrl(location, point)}
          rel="noopener noreferrer"
          target="_blank"
        >
          Get directions
        </a>
      </Button>
      <Button asChild size="sm" variant="outline">
        <a
          href={appleMapsUrl(location, point)}
          rel="noopener noreferrer"
          target="_blank"
        >
          Apple Maps
        </a>
      </Button>
    </div>
  );
}

export function WalkMap({
  location,
  point,
}: {
  location: string;
  point: GeoPoint | null;
}) {
  const o = { ...DEFAULT_LOOK, ...useContext(MapLookContext) };
  const height =
    o.height === "short" ? "h-44" : o.height === "tall" ? "h-96" : "h-64";
  const map = point ? (
    <iframe
      className={cn(
        "block w-full border-0 bg-muted",
        height,
        o.look === "split" && "lg:h-full lg:min-h-64",
      )}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={osmEmbedUrl(point)}
      title={`Map of ${location}`}
    />
  ) : null;
  const buttons =
    o.buttons === "none" ? null : (
      <DirectionsButtons location={location} point={point} />
    );
  const title = o.showTitle ? (
    <div className="flex flex-col gap-1">
      <h3 className="text-base font-semibold">Meeting point</h3>
      <p className="text-sm text-muted-foreground">{location}</p>
    </div>
  ) : null;
  const note = o.showNote ? (
    point ? (
      <p className="text-xs text-muted-foreground">
        Map data from{" "}
        <a
          className="underline-offset-4 hover:underline"
          href={osmViewUrl(point)}
          rel="noopener noreferrer"
          target="_blank"
        >
          OpenStreetMap
        </a>
        , free to use. Directions open Google or Apple Maps on your phone.
      </p>
    ) : (
      <p className="text-xs text-muted-foreground">
        Get directions opens Google or Apple Maps with this meeting point. A map
        pin appears here when the place can be found.
      </p>
    )
  ) : null;

  if (o.look === "card" && o.buttons !== "over") {
    // The original card (walk pages outside the designer always use this).
    return (
      <Card className="gap-4 overflow-hidden py-0">
        {o.showTitle || o.buttons === "above" ? (
          <CardHeader
            className={cn("px-6 pt-6", o.buttons === "above" && "gap-3")}
          >
            {o.showTitle ? (
              <>
                <CardTitle className="text-base">Meeting point</CardTitle>
                <CardDescription>{location}</CardDescription>
              </>
            ) : null}
            {o.buttons === "above" ? buttons : null}
          </CardHeader>
        ) : null}
        {map ? (
          <div
            className={cn(
              "border-y",
              !o.showTitle && o.buttons !== "above" && "border-t-0",
            )}
          >
            {map}
          </div>
        ) : null}
        {(o.buttons === "below" && buttons) || note ? (
          <CardContent className="flex flex-col gap-3 px-6 pb-6">
            {o.buttons === "below" ? buttons : null}
            {note}
          </CardContent>
        ) : null}
      </Card>
    );
  }

  if (o.look === "bare") {
    return (
      <div className="flex flex-col gap-3">
        {o.buttons === "above" ? buttons : null}
        <div className={cn("relative overflow-hidden rounded-2xl", BLEED)}>
          {map}
          {o.buttons === "over" ? (
            <div className="absolute right-3 bottom-3 left-3 sm:right-auto">
              {buttons}
            </div>
          ) : null}
        </div>
        {o.buttons === "below" ? buttons : null}
      </div>
    );
  }

  if (o.look === "overlay" || (o.look === "card" && o.buttons === "over")) {
    // The map fills the block; the meeting point and buttons float over it.
    return (
      <div className={cn("relative overflow-hidden rounded-2xl border", BLEED)}>
        {map ?? <div className={cn("bg-muted", height)} />}
        <div className="absolute right-3 bottom-3 left-3 flex flex-col gap-3 rounded-xl bg-background/95 p-4 shadow-lg backdrop-blur-sm sm:right-auto sm:max-w-sm">
          {title}
          {o.buttons === "none" ? null : buttons}
        </div>
      </div>
    );
  }

  if (o.look === "split") {
    return (
      <div
        className={cn(
          "grid overflow-hidden rounded-2xl border lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]",
          BLEED,
        )}
      >
        <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
          {title}
          {o.buttons === "none" ? null : buttons}
          {note}
        </div>
        <div className="max-lg:order-first">{map}</div>
      </div>
    );
  }

  // Flat: no frame, the map running the block's full width (edge to edge in a full-width block).
  return (
    <div className="flex flex-col gap-3">
      {title}
      {o.buttons === "above" ? buttons : null}
      <div className="relative">
        {map}
        {o.buttons === "over" ? (
          <div className="absolute right-3 bottom-3 left-3 sm:right-auto">
            {buttons}
          </div>
        ) : null}
      </div>
      {o.buttons === "below" ? buttons : null}
      {note}
    </div>
  );
}
