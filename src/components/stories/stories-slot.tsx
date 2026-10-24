import { getStoriesEnabled } from "@/lib/stories-settings";
import { StoriesRow } from "./stories-row";

/** The stories row, unless stories are switched off in Settings. */
export async function StoriesSlot() {
  return (await getStoriesEnabled()) ? <StoriesRow /> : null;
}
