/**
 * Tick-box facilities for a walk (Create / Edit walk → Details → Essentials).
 * Stored as their keys in Walk.essentials, so a label or emoji can change
 * here without touching saved walks. Unknown keys (one removed from this
 * list later) are dropped when read.
 */
export const WALK_ESSENTIALS = [
  { key: "toilets", emoji: "🚻", label: "Toilets available" },
  { key: "parking", emoji: "🅿️", label: "Parking" },
  { key: "cafe", emoji: "☕", label: "Café or refreshments" },
  { key: "dogs", emoji: "🐕", label: "Dog friendly" },
  { key: "stepFree", emoji: "♿", label: "Step-free / pushchair friendly" },
  { key: "bus", emoji: "🚌", label: "Near public transport" },
  { key: "boots", emoji: "🥾", label: "Walking boots recommended" },
  { key: "stiles", emoji: "🪜", label: "Stiles on the route" },
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
