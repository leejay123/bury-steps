"use client";

import { useEffect, useState } from "react";
import type * as LeafletNS from "leaflet";

export type Leaflet = typeof LeafletNS;

/**
 * Leaflet reaches for `window` as soon as it is imported, so it can only be
 * pulled in from the browser. Importing it inside an effect keeps these
 * components plain client components — no next/dynamic wrapper, no
 * `ssr: false` boundary around the whole card.
 *
 * Returns null until the library has landed; callers render a placeholder
 * of the same height so the page doesn't jump.
 */
export function useLeaflet(): Leaflet | null {
  const [leaflet, setLeaflet] = useState<Leaflet | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((mod) => {
      if (!cancelled) setLeaflet(mod.default ?? (mod as unknown as Leaflet));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return leaflet;
}

/**
 * OpenStreetMap's own tiles: free, no key, no account, nothing that can
 * expire or bill us. Their usage policy asks for attribution (below) and
 * discourages heavy traffic — a walking group opening a handful of maps a
 * week is comfortably inside what they ask for.
 */
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Bury town centre — where the map opens when there's nothing to fit yet. */
export const DEFAULT_CENTRE: [number, number] = [53.5933, -2.2966];
export const DEFAULT_ZOOM = 14;

/**
 * Leaflet's default marker points at image files it expects to find next to
 * its CSS, which bundlers rename — the classic "missing marker" bug. These
 * are drawn with CSS instead, so there are no image assets to go missing.
 */
export function dotIcon(leaflet: Leaflet, variant: "start" | "finish"): LeafletNS.DivIcon {
  const colour = variant === "start" ? "#16a34a" : "#dc2626";
  const label = variant === "start" ? "Start" : "Finish";
  return leaflet.divIcon({
    className: "",
    html: `<span aria-label="${label}" role="img" style="
      display:block;width:16px;height:16px;border-radius:9999px;
      background:${colour};border:3px solid #fff;
      box-shadow:0 0 0 1px rgba(0,0,0,.25);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}
