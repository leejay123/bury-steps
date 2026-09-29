import { Accessibility, Bus, Coffee, Dog, Fence, Footprints, SquareParking, Toilet } from "lucide-react";

/**
 * Tick-box facilities for a walk (Create / Edit walk → Details → Essentials).
 * Stored as their keys in Walk.essentials, so a label or icon can change
 * here without touching saved walks. Icons are Lucide, like the rest of the
 * site. Unknown keys (one removed from this list later) are dropped when read.
 */
export const WALK_ESSENTIALS = [
  { key: "toilets", icon: Toilet, label: "Toilets available" },
  { key: "parking", icon: SquareParking, label: "Parking" },
  { key: "cafe", icon: Coffee, label: "Café or refreshments" },
  { key: "dogs", icon: Dog, label: "Dog friendly" },
  { key: "stepFree", icon: Accessibility, label: "Step-free / pushchair friendly" },
  { key: "bus", icon: Bus, label: "Near public transport" },
  { key: "boots", icon: Footprints, label: "Walking boots recommended" },
  { key: "stiles", icon: Fence, label: "Stiles on the route" },
] as const;

export type WalkEssential = (typeof WALK_ESSENTIALS)[number];

const KEYS = new Set<string>(WALK_ESSENTIALS.map((item) => item.key));

/** Known keys only, in the list's own order, no repeats. */
export function parseWalkEssentials(raw: readonly unknown[] | null | undefined): string[] {
  const picked = new Set((raw ?? []).filter((value): value is string => typeof value === "string" && KEYS.has(value)));
  return WALK_ESSENTIALS.filter((item) => picked.has(item.key)).map((item) => item.key);
}

export function walkEssentialItems(keys: readonly string[] | null | undefined): WalkEssential[] {
  const picked = new Set(keys ?? []);
  return WALK_ESSENTIALS.filter((item) => picked.has(item.key));
}
