const KEY = "bury-steps:flash-toast";

export type FlashToast = { type: "success" | "error"; message: string };

/** Stash a toast that must survive a full page navigation (hard assign). */
export function setFlashToast(next: FlashToast) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota — soft-fail; the action still succeeded.
  }
}

/** Read and clear a stashed toast, if any. */
export function consumeFlashToast(): FlashToast | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as FlashToast;
    if (
      !parsed ||
      (parsed.type !== "success" && parsed.type !== "error") ||
      typeof parsed.message !== "string" ||
      !parsed.message
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
