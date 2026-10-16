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
import { Map as MapIcon, Navigation } from "lucide-react";

/**
 * How the meeting-point map looks. Walk pages use the card; the walk page
 * designer's Map block sets the rest (MapLookProvider) — no frame, the map
 * alone, the details floating over the map, or
 * side by side — and where the directions buttons go, or none.
 */
export type MapLook = {
  look?: "card" | "flat" | "bare" | "overlay" | "split";
  buttons?: "below" | "above" | "over" | "none";
  height?: "short" | "medium" | "tall";
  showTitle?: boolean;
  showNote?: boolean;
  buttonsLook?: DirectionsLook;
  corners?: "rounded" | "square" | "very-rounded";
  /** Something placed with the map, e.g. the precise location (the designer). */
  extra?: ReactNode;
  extraAt?: "above-map" | "on-map" | "below-map" | "after";
};
const DEFAULT_LOOK: Required<MapLook> = {
  look: "card",
  buttons: "below",
  height: "medium",
  showTitle: true,
  showNote: true,
  extra: null,
  extraAt: "below-map",
  buttonsLook: "default",
  corners: "rounded",
};
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

export type DirectionsLook =
  | "default"
  | "outline"
  | "solid"
  | "ghost"
  | "pills"
  | "icons"
  | "links"
  | "stacked";

/** Get directions and Apple Maps, for the map or to place on their own, in a chosen look. */
export function DirectionsButtons({
  className,
  location,
  point = null,
  look = "default",
}: {
  className?: string;
  location: string;
  point?: GeoPoint | null;
  look?: DirectionsLook;
}) {
  const links = [
    {
      href: googleDirectionsUrl(location, point),
      label: "Get directions",
      Icon: Navigation,
      primary: true,
    },
    {
      href: appleMapsUrl(location, point),
      label: "Apple Maps",
      Icon: MapIcon,
      primary: false,
    },
  ];
  if (look === "links")
    return (
      <div className={cn("flex flex-wrap gap-x-4 gap-y-1 text-sm", className)}>
        {links.map(({ href, label, Icon }) => (
          <a
            className="flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
            href={href}
            key={label}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Icon aria-hidden className="size-4 text-muted-foreground" />
            {label}
          </a>
        ))}
      </div>
    );
  return (
    <div
      className={cn(
        look === "stacked"
          ? "flex flex-col gap-2"
          : "grid grid-cols-2 gap-2 sm:flex",
        className,
      )}
    >
      {links.map(({ href, label, Icon, primary }) => (
        <Button
          asChild
          className={cn(
            look === "pills" && "rounded-full",
            look === "stacked" && "w-full",
          )}
          key={label}
          size="sm"
          variant={
            look === "outline"
              ? "outline"
              : look === "solid"
                ? "default"
                : look === "ghost"
                  ? "ghost"
                  : look === "pills"
                    ? primary
                      ? "default"
                      : "secondary"
                    : primary
                      ? "default"
                      : "outline"
          }
        >
          <a href={href} rel="noopener noreferrer" target="_blank">
            {look === "icons" ? <Icon data-icon="inline-start" /> : null}
            {label}
          </a>
        </Button>
      ))}
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
  // Square, rounded or very rounded corners on the map's card or frame.
  const round =
    o.corners === "square"
      ? "rounded-none"
      : o.corners === "very-rounded"
        ? "rounded-3xl"
        : "";
  const cornerTop =
    o.corners === "square"
      ? ""
      : o.corners === "very-rounded"
        ? "overflow-hidden rounded-t-3xl"
        : "overflow-hidden rounded-t-xl";
  const cornerBottom =
    o.corners === "square"
      ? ""
      : o.corners === "very-rounded"
        ? "overflow-hidden rounded-b-3xl"
        : "overflow-hidden rounded-b-xl";
  const at = (where: MapLook["extraAt"]) =>
    o.extra && o.extraAt === where ? o.extra : null;
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
  // The map, with anything chosen to sit on it (top left) and the
  // directions buttons when they go on it (bottom).
  const mapArea = (className?: string) =>
    map ? (
      <div className={cn("relative", className)}>
        {map}
        {at("on-map") ? (
          <div className="absolute top-3 right-3 left-3 flex">
            {at("on-map")}
          </div>
        ) : null}
        {o.buttons === "over" && o.look !== "overlay" ? (
          <div className="absolute right-3 bottom-3 left-3 sm:right-auto">
            {buttons}
          </div>
        ) : null}
      </div>
    ) : (
      at("on-map")
    );
  const buttons =
    o.buttons === "none" ? null : (
      <DirectionsButtons
        location={location}
        look={o.buttonsLook}
        point={point}
      />
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

  if (o.look === "card") {
    // The original card (walk pages outside the designer always use this).
    const top = o.showTitle || o.buttons === "above" || at("above-map");
    const bottom =
      (o.buttons === "below" && buttons) ||
      note ||
      at("below-map") ||
      at("after");
    return (
      <Card className={cn("gap-4 overflow-hidden py-0", round)}>
        {top ? (
          <CardHeader
            className={cn(
              "px-6 pt-6",
              (o.buttons === "above" || at("above-map")) && "gap-3",
            )}
          >
            {o.showTitle ? (
              <>
                <CardTitle className="text-base">Meeting point</CardTitle>
                <CardDescription>{location}</CardDescription>
              </>
            ) : null}
            {at("above-map")}
            {o.buttons === "above" ? buttons : null}
          </CardHeader>
        ) : null}
        {mapArea(
          cn(
            "border-y",
            !top && "border-t-0",
            !bottom && "border-b-0",
            // At the card's top or bottom edge the map takes the card's
            // rounded corners itself: some browsers (Safari) don't trim a
            // map to a rounded card, so its square corners poked out.
            "[&>iframe]:rounded-[inherit]",
            !top && cornerTop,
            !bottom && cornerBottom,
          ),
        )}
        {bottom ? (
          <CardContent className="flex flex-col gap-3 px-6 pb-6">
            {at("below-map")}
            {o.buttons === "below" ? buttons : null}
            {note}
            {at("after")}
          </CardContent>
        ) : null}
      </Card>
    );
  }

  if (o.look === "bare") {
    return (
      <div className="flex flex-col gap-3">
        {at("above-map")}
        {o.buttons === "above" ? buttons : null}
        {mapArea(
          cn("overflow-hidden rounded-2xl [&>iframe]:rounded-[inherit]", round),
        )}
        {at("below-map")}
        {o.buttons === "below" ? buttons : null}
        {at("after")}
      </div>
    );
  }

  if (o.look === "overlay") {
    // The map fills the block; the meeting point and buttons float over it.
    return (
      <div className={cn("relative overflow-hidden rounded-2xl border", round)}>
        {mapArea() ?? <div className={cn("bg-muted", height)} />}
        <div className="absolute right-3 bottom-3 left-3 flex flex-col gap-3 rounded-xl bg-background/95 p-4 shadow-lg backdrop-blur-sm sm:right-auto sm:max-w-sm">
          {title}
          {at("above-map")}
          {buttons}
          {at("below-map")}
          {at("after")}
        </div>
      </div>
    );
  }

  if (o.look === "split") {
    return (
      <div
        className={cn(
          "grid overflow-hidden rounded-2xl border lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]",
          round,
        )}
      >
        <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
          {title}
          {at("above-map")}
          {o.buttons === "over" ? null : buttons}
          {at("below-map")}
          {note}
          {at("after")}
        </div>
        {mapArea("max-lg:order-first")}
      </div>
    );
  }

  // No frame: the title, map and buttons straight on the page.
  return (
    <div className="flex flex-col gap-3">
      {title}
      {at("above-map")}
      {o.buttons === "above" ? buttons : null}
      {mapArea()}
      {at("below-map")}
      {o.buttons === "below" ? buttons : null}
      {note}
      {at("after")}
    </div>
  );
}
