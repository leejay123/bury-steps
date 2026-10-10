import { cookies } from "next/headers";
import { PLACEHOLDER_PREVIEW_COOKIE } from "@/lib/placeholder-preview-cookie";

/** True in a browser where an owner turned on "Preview loading placeholders". */
export async function previewingPlaceholders(): Promise<boolean> {
  return (await cookies()).get(PLACEHOLDER_PREVIEW_COOKIE)?.value === "1";
}
