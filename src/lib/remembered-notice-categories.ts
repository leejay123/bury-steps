import { cookies } from "next/headers";

export const NOTICE_CATS_COOKIE = "bs-notice-cats";

export type RememberedNoticeCategory = { id: string; label: string };

/** The category chips last shown on Notices, so a refresh can draw them at once. */
export function parseRememberedNoticeCategories(raw: string | undefined): RememberedNoticeCategory[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((label, index) => {
        if (typeof label !== "string") return [];
        const text = label.trim();
        if (!text || text.length > 32) return [];
        return [{ id: index === 0 ? "all" : `cat-${index}`, label: text }];
      })
      .slice(0, 9);
  } catch {
    return [];
  }
}

/** Null when this browser has not shown the chip bar yet. */
export async function rememberedNoticeCategories(): Promise<RememberedNoticeCategory[] | null> {
  const jar = await cookies();
  const labels = parseRememberedNoticeCategories(jar.get(NOTICE_CATS_COOKIE)?.value);
  return labels.length > 1 ? labels : null;
}
