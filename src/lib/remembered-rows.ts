import { cookies } from "next/headers";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { rememberedRowsCookie } from "@/lib/remembered-rows-key";

/** Last time this list was shown. Missing cookie is unknown (null), not a guessed size. */
export async function rememberedCount(key: string, max = LIST_PAGE_SIZE): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(rememberedRowsCookie(key))?.value;
  if (raw == null || raw === "") return null;
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 0) return null;
  return Math.min(count, max);
}

/** How many list rows to draw while this page loads. Unknown lists draw none. */
export async function rememberedRows(key: string): Promise<number> {
  return (await rememberedCount(key, LIST_PAGE_SIZE)) ?? 0;
}

/** A short string saved from the last visit. Empty or oversized values are ignored. */
export async function rememberedText(name: string, max = 500): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(name)?.value;
  if (!raw) return null;
  try {
    const text = decodeURIComponent(raw);
    if (!text || text.length > max) return null;
    return text;
  } catch {
    return null;
  }
}

/** One line of copy per list row, from the last visit. */
export async function rememberedLines(name: string, max = LIST_PAGE_SIZE): Promise<string[] | null> {
  const raw = await rememberedText(name, 4000);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const lines = parsed.flatMap((line) => (typeof line === "string" && line.length <= 120 ? [line] : []));
    return lines.slice(0, max);
  } catch {
    return null;
  }
}
