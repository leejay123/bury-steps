import { revalidatePath as nextRevalidatePath, revalidateTag as nextRevalidateTag } from "next/cache";
import { SITE_VERSION_TAG } from "@/lib/site-version";

/**
 * Next's revalidatePath / revalidateTag, plus "something changed" for open
 * pages: every save in the app already calls one of these, so routing them
 * through here means no save can forget to tell open pages to refresh.
 */
export function revalidatePath(...args: Parameters<typeof nextRevalidatePath>) {
  nextRevalidatePath(...args);
  nextRevalidateTag(SITE_VERSION_TAG, { expire: 0 });
}

export function revalidateTag(...args: Parameters<typeof nextRevalidateTag>) {
  nextRevalidateTag(...args);
  nextRevalidateTag(SITE_VERSION_TAG, { expire: 0 });
}
