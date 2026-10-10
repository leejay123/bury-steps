import { cookies } from "next/headers";
import {
  PLACEHOLDER_HOLD_MS,
  PLACEHOLDER_PREVIEW_COOKIE,
  parsePlaceholderPreview,
  type PlaceholderPreviewMode,
} from "@/lib/placeholder-preview-cookie";

/** The preview mode an owner turned on in this browser, if any. */
export async function placeholderPreviewMode(): Promise<PlaceholderPreviewMode | null> {
  return parsePlaceholderPreview((await cookies()).get(PLACEHOLDER_PREVIEW_COOKIE)?.value);
}

/** "Hold": wait a few seconds so the page's placeholder stays up (a short, fixed delay — never left open). */
export function holdForPreview() {
  return new Promise<void>((resolve) => setTimeout(resolve, PLACEHOLDER_HOLD_MS));
}
