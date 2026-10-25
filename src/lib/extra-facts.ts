/**
 * A walk's own extra facts ("Parking: Bank Lane car park"), added with
 * + Add a fact on the walk form and shown with the other facts.
 */
export type ExtraFact = { name: string; value: string };

export const MAX_EXTRA_FACTS = 8;
export const MAX_EXTRA_FACT_NAME = 40;
export const MAX_EXTRA_FACT_VALUE = 150;

/** Saved or sent facts, tidied: both parts filled in, trimmed, capped. */
export function parseExtraFacts(raw: unknown): ExtraFact[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      name: String((item as { name?: unknown })?.name ?? "").trim().slice(0, MAX_EXTRA_FACT_NAME),
      value: String((item as { value?: unknown })?.value ?? "").trim().slice(0, MAX_EXTRA_FACT_VALUE),
    }))
    .filter((fact) => fact.name && fact.value)
    .slice(0, MAX_EXTRA_FACTS);
}
