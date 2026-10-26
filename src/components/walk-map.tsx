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
import { Map as MapIcon, MapPin, Navigation } from "lucide-react";

/**
 * How the meeting-point map looks. Walk pages use the card; the walk page
 * designer's Map block sets the rest (MapLookProvider) — no frame, the map
 * alone, the details floating over the map, or
 * side by side — and where the directions buttons go, or none.
 */
export type MapLook = {
  look?:
    | "card"
    | "flat"
    | "bare"
    | "overlay"
    | "split"
    | "map-first"
    | "inset"
    | "grey"
    | "banner"
    | "chip"
    | "dark"
    | "dashed"
    | "strip"
    | "toolbar"
    | "postcard"
    | "ticket"
    | "circle"
    | "header-band";
  /** How "Meeting point" and the place show. */
  titleStyle?: MapTitleStyle;
  buttons?: "below" | "above" | "over" | "none";
  height?: "short" | "medium" | "tall";
  showTitle?: boolean;
  showNote?: boolean;
  buttonsLook?: DirectionsLook;
  corners?: "rounded" | "square" | "very-rounded";
  /** The map's own colours: as it comes, toned down, grey, pale grey or dark. */
  tiles?: MapTiles;
  /** Something placed with the map, e.g. the precise location (the designer). */
  extra?: ReactNode;
  extraAt?: "above-map" | "on-map" | "below-map" | "after";
};
export type MapTitleStyle =
  | "standard"
  | "label"
  | "icon"
  | "place"
  | "one-line"
  | "big"
  | "pin"
  | "badge"
  | "dark-icon"
  | "underline"
  | "bar";
export type MapTiles = "colour" | "muted" | "grey" | "pale" | "dark";
/** CSS filters on the map (the map service has no styles of its own to pick). */
const TILE_FILTER: Record<MapTiles, string> = {
  colour: "",
  muted: "[filter:saturate(0.45)]",
  grey: "grayscale",
  pale: "[filter:grayscale(1)_contrast(0.8)_brightness(1.1)]",
  dark: "[filter:grayscale(1)_invert(0.92)_contrast(0.9)]",
};
const DEFAULT_LOOK: Required<MapLook> = {
  titleStyle: "standard",
  tiles: "colour",
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
  | "stacked"
  | "grey"
  | "round-icons"
  | "one";

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
  if (look === "round-icons")
    return (
      <div className={cn("flex gap-2", className)}>
        {links.map(({ href, label, Icon, primary }) => (
          <Button
            aria-label={label}
            asChild
            className="rounded-full"
            key={label}
            size="icon"
            variant={primary ? "default" : "outline"}
          >
            <a href={href} rel="noopener noreferrer" target="_blank" title={label}>
              <Icon />
            </a>
          </Button>
        ))}
      </div>
    );
  if (look === "one")
    return (
      <Button asChild className={cn("w-full", className)}>
        <a href={links[0].href} rel="noopener noreferrer" target="_blank">
          <Navigation data-icon="inline-start" />
          {links[0].label}
        </a>
      </Button>
    );
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
            look === "grey"
              ? "secondary"
              : look === "outline"
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
  const designed = useContext(MapLookContext);
  const o = { ...DEFAULT_LOOK, ...designed };
  // On a designed page, no map pin means no map: the Directions block (or
  // the card's buttons elsewhere) still gets people there, and a map box
  // with nothing in it only takes up room. Other walk pages keep the box.
  if (designed && !point) return null;
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
        TILE_FILTER[o.tiles] ?? "",
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
          <div className="absolute right-3 bottom-12 left-3 sm:right-auto sm:bottom-8">
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
  // "Meeting point" and the place, in the chosen style.
  const title = !o.showTitle ? null : o.titleStyle === "label" ? (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Meeting point
      </p>
      <h3 className="text-base font-semibold">{location}</h3>
    </div>
  ) : o.titleStyle === "icon" ? (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <MapPin aria-hidden className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-base font-semibold">Meeting point</h3>
        <p className="truncate text-sm text-muted-foreground">{location}</p>
      </div>
    </div>
  ) : o.titleStyle === "big" ? (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-xl font-semibold tracking-tight">{location}</h3>
      <p className="text-xs text-muted-foreground">Meeting point</p>
    </div>
  ) : o.titleStyle === "pin" ? (
    <h3 className="flex items-center gap-2 text-base font-semibold">
      <MapPin aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate">{location}</span>
    </h3>
  ) : o.titleStyle === "badge" ? (
    <div className="flex flex-col items-start gap-2">
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
        Meeting point
      </span>
      <h3 className="text-base font-semibold">{location}</h3>
    </div>
  ) : o.titleStyle === "dark-icon" ? (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
        <MapPin aria-hidden className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-base font-semibold">Meeting point</h3>
        <p className="truncate text-sm text-muted-foreground">{location}</p>
      </div>
    </div>
  ) : o.titleStyle === "underline" ? (
    <div className="flex flex-col gap-2">
      <h3 className="border-b pb-2 text-base font-semibold">Meeting point</h3>
      <p className="text-sm text-muted-foreground">{location}</p>
    </div>
  ) : o.titleStyle === "bar" ? (
    <div className="flex flex-col gap-0.5 border-l-4 border-l-foreground pl-3">
      <h3 className="text-base font-semibold">Meeting point</h3>
      <p className="text-sm text-muted-foreground">{location}</p>
    </div>
  ) : o.titleStyle === "place" ? (
    <h3 className="text-base font-semibold">{location}</h3>
  ) : o.titleStyle === "one-line" ? (
    <p className="truncate text-sm">
      <span className="font-semibold">Meeting point</span>
      <span className="text-muted-foreground"> · {location}</span>
    </p>
  ) : (
    <div className="flex flex-col gap-1">
      <h3 className="text-base font-semibold">Meeting point</h3>
      <p className="text-sm text-muted-foreground">{location}</p>
    </div>
  );
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
            {o.showTitle && o.titleStyle !== "standard" ? title : null}
            {o.showTitle && o.titleStyle === "standard" ? (
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
        {/* Clear of the map's © OpenStreetMap line (its licence needs it
            seen), and as wide as its buttons need (they stuck out). */}
        <div className="absolute right-3 bottom-12 left-3 flex flex-col gap-3 rounded-xl bg-background/95 p-4 shadow-lg backdrop-blur-sm sm:right-auto sm:bottom-8 sm:w-max sm:max-w-[calc(100%-1.5rem)]">
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

  if (o.look === "map-first" || o.look === "grey" || o.look === "inset") {
    // A card with the map first (edge to edge, or inset with space round
    // it), then the title, buttons and small print; or a grey box.
    const inset = o.look === "inset";
    return (
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-xl",
          o.look === "grey" ? "bg-muted" : "border bg-card",
          inset && "gap-4 p-4",
          round,
        )}
      >
        {mapArea(
          cn(
            "[&>iframe]:rounded-[inherit]",
            inset ? "overflow-hidden rounded-lg" : o.look === "grey" ? "" : "border-b",
            !inset && cornerTop,
          ),
        )}
        <div className={cn("flex flex-col gap-3", !inset && "p-5")}>
          {title}
          {at("above-map")}
          {o.buttons === "none" || o.buttons === "over" ? null : buttons}
          {at("below-map")}
          {note}
          {at("after")}
        </div>
      </div>
    );
  }

  if (o.look === "banner" || o.look === "chip") {
    // The map with the title on it: a bar along the bottom, or a small
    // chip in the top corner; the buttons and small print under it.
    return (
      <div className="flex flex-col gap-3">
        {at("above-map")}
        {o.buttons === "above" ? buttons : null}
        <div className={cn("relative overflow-hidden rounded-xl border", round)}>
          {mapArea() ?? <div className={cn("bg-muted", height)} />}
          {title ? (
            <div
              className={cn(
                "absolute bg-background/95 backdrop-blur-sm",
                // Along the top (the bottom has the map's © line), short of
                // the + and − buttons.
                o.look === "banner"
                  ? "top-0 right-14 left-0 rounded-br-lg border-r border-b px-4 py-3"
                  : "top-3 left-3 max-w-[80%] rounded-lg border px-3 py-2 shadow-sm",
              )}
            >
              {title}
            </div>
          ) : null}
        </div>
        {at("below-map")}
        {o.buttons === "below" ? buttons : null}
        {note}
        {at("after")}
      </div>
    );
  }

  const showButtons = o.buttons !== "none" && o.buttons !== "over";
  const extras = (
    <>
      {at("above-map")}
      {at("below-map")}
    </>
  );

  if (o.look === "dark" || o.look === "dashed" || o.look === "postcard") {
    // A black card, a dashed one, or a postcard (the map framed, words under).
    const dark = o.look === "dark";
    return (
      <div
        className={cn(
          "flex flex-col gap-4 overflow-hidden rounded-xl p-4",
          dark &&
            "bg-neutral-950 text-white [&_.text-muted-foreground]:text-white/60 [&_[data-slot=button]]:border-white/20 [&_[data-slot=button]]:bg-white [&_[data-slot=button]]:text-neutral-950",
          o.look === "dashed" && "border border-dashed bg-muted/30",
          o.look === "postcard" && "border bg-card shadow-sm",
          round,
        )}
      >
        {o.look === "postcard" ? null : title}
        {mapArea(
          cn(
            "overflow-hidden rounded-lg [&>iframe]:rounded-[inherit]",
            o.look === "postcard" && "border",
          ),
        )}
        {o.look === "postcard" ? (
          <div className="flex flex-col items-center gap-3 text-center">
            {title}
          </div>
        ) : null}
        {extras}
        {showButtons ? buttons : null}
        {note}
        {at("after")}
      </div>
    );
  }

  if (o.look === "strip" || o.look === "circle") {
    // A small map (square, or round) beside the words: compact.
    return (
      <div className={cn("flex items-center gap-4 rounded-xl border p-3", round)}>
        {mapArea(
          cn(
            "size-28 shrink-0 overflow-hidden [&>iframe]:h-full! [&>iframe]:min-h-0!",
            o.look === "circle" ? "rounded-full" : "rounded-lg",
          ),
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {title}
          {extras}
          {showButtons ? buttons : null}
          {at("after")}
        </div>
      </div>
    );
  }

  if (o.look === "toolbar" || o.look === "ticket" || o.look === "header-band") {
    // A card: the title on top (in a grey band for header-band), the map,
    // then the buttons in a bar (a dashed tear line for the ticket).
    return (
      <div className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", round)}>
        {title ? (
          <div
            className={cn(
              "px-5 py-4",
              o.look === "header-band" && "bg-muted",
              o.look === "ticket" && "border-b border-dashed",
            )}
          >
            {title}
          </div>
        ) : null}
        {at("above-map") ? <div className="px-5 pb-4">{at("above-map")}</div> : null}
        {mapArea(o.look === "header-band" ? "" : "border-y")}
        {at("below-map") ? <div className="px-5 pt-4">{at("below-map")}</div> : null}
        {showButtons || note || at("after") ? (
          <div
            className={cn(
              "flex flex-col gap-3 px-5 py-4",
              o.look === "toolbar" && "bg-muted",
              o.look === "ticket" && "border-t border-dashed",
            )}
          >
            {showButtons ? buttons : null}
            {note}
            {at("after")}
          </div>
        ) : null}
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
