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
