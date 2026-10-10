import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import {
  PLACEHOLDER_HOLD_MS,
  PLACEHOLDER_PREVIEW_COOKIE,
  parsePlaceholderPreview,
  type PlaceholderPreviewMode,
} from "@/lib/placeholder-preview-cookie";

/**
 * The preview mode an owner turned on in this browser, if any. A private
 * saved copy (kept in this browser only, five minutes — the shortest a
 * page fetched ahead reuses): read straight from the cookie, it stopped a
 * page being fetched ahead of the click (Notices showed its placeholder
 * every time). Changing the switch refreshes the page, so it still takes
 * effect at once. See the Next.js guide optimizing-prefetching.md,
 * "use cache: private".
 */
export async function placeholderPreviewMode(): Promise<PlaceholderPreviewMode | null> {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  return parsePlaceholderPreview((await cookies()).get(PLACEHOLDER_PREVIEW_COOKIE)?.value);
}

/** "Hold": wait a few seconds so the page's placeholder stays up (a short, fixed delay — never left open). */
export function holdForPreview() {
  return new Promise<void>((resolve) => setTimeout(resolve, PLACEHOLDER_HOLD_MS));
}
